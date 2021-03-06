/**
 * Copyright 2022 MobiledgeX, Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Suspense, Component, lazy, Fragment } from 'react';
import cloneDeep from 'lodash/cloneDeep';
import { withRouter } from 'react-router-dom';
//Mex
import MexForms, { SELECT, MULTI_SELECT, BUTTON, INPUT, SWITCH, TEXT_AREA, ICON_BUTTON, SELECT_RADIO_TREE, formattedData, HEADER, MULTI_FORM, MAIN_HEADER, TIME_COUNTER, findIndexs } from '../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { localFields } from '../../../services/fields';
import { redux_org } from '../../../helper/reduxData';
import { endpoint, service, updateFieldData, websocket } from '../../../services'
import { getOrganizationList } from '../../../services/modules/organization';
import { getFlavorList, showFlavors } from '../../../services/modules/flavor/flavor';
import { getAutoProvPolicyList, showAutoProvPolicies } from '../../../services/modules/autoProvPolicy';
import { getAlertPolicyList, showAlertPolicy } from '../../../services/modules/alertPolicy';
import { createApp, updateApp } from '../../../services/modules/app';
import { refreshAllAppInst, showAppInsts } from '../../../services/modules/appInst';
import MexMultiStepper, { updateStepper } from '../../../hoc/stepper/MexMessageMultiStream'
import { HELP_APP_REG } from "../../../tutorial";
import { uploadData } from '../../../utils/file_util'
import { uniqueId, validateRemoteCIDR } from '../../../helper/constant/shared'

import * as appFlow from '../../../hoc/mexFlow/appFlow'
import { Grid } from '@material-ui/core';
import { perpetual } from '../../../helper/constant';
import { componentLoader } from '../../../hoc/loader/componentLoader';
import { changeHostName } from '../../../utils/location_utils';
import { responseValid } from '../../../services/config';

const MexFlow = lazy(() => componentLoader(import('../../../hoc/mexFlow/MexFlow')));
const SERVERCONFIG_HEADER = 'ServerLess Config'

class AppReg extends Component {
    constructor(props) {
        super(props);
        this.state = {
            forms: [],
            stepsArray: [],
            showGraph: false,
            flowDataList: []
        }
        this._isMounted = false
        this.isUpdate = this.props.id === perpetual.ACTION_UPDATE
        this.isClone = this.props.id === perpetual.ACTION_CLONE
        this.isAdd = this.props.id === undefined
        this.regions = cloneDeep(props.regions)
        if (!this.isUpdate) { this.regions.splice(0, 0, 'All') }
        this.flavorList = []
        this.autoProvPolicyList = []
        this.alertPolicyList = []
        this.requestedRegionList = []
        this.appInstanceList = []
        this.configOptions = [perpetual.CONFIG_ENV_VAR, perpetual.CONFIG_HELM_CUST]
        this.originalData = undefined
        this.serverlessMenu = false
        this.expandAdvanceMenu = false
        this.tlsCount = 0
        this.updateFlowDataList = []
        this.imagePathTyped = false
        this.appInstExist = false
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    validateOCPortRange = (form) => {
        if (form.value && form.value.length > 0) {
            let value = parseInt(form.value)
            if (value < 1 || value > 65535) {
                form.error = 'Invalid Port Range (must be between 1-65535)'
                return false;
            }
        }
        form.error = undefined;
        return true;
    }

    validatePortRange = (currentForm) => {
        let forms = currentForm.parent.form.forms
        let protocol = undefined
        let portRange = undefined
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === localFields.protocol) {
                protocol = form.value
            }
            else if (form.field === localFields.portRangeMax || form.field === localFields.portRangeMin) {
                portRange = form.value
            }
        }
        if (currentForm.value && currentForm.value.length > 0) {
            let value = parseInt(currentForm.value)
            if (value < 1 || value > 65535) {
                currentForm.error = 'Invalid Port Range (must be between 1-65535)'
                return false;
            }
            else if (protocol === 'tcp') {
                if (value === 22) {
                    currentForm.error = 'App cannot use tcp port 22, as it is reserved for platform inter-node SSH'
                    return false;
                }
                else if (currentForm.field === localFields.portRangeMax || currentForm.field === localFields.portRangeMin) {
                    let portRangeMin = portRange > currentForm.value ? currentForm.value : portRange
                    let portRangeMax = portRange < currentForm.value ? currentForm.value : portRange
                    if (22 >= portRangeMin && 22 <= portRangeMax) {
                        currentForm.error = 'App port range cannot use tcp port 22, as it is reserved for platform inter-node SSH'
                        return false;
                    }
                }
            }
        }
        currentForm.error = undefined;
        return true;
    }

    validateAppName = (form) => {
        if (form.value && form.value.length > 0) {
            let value = form.value
            if (value.includes('_')) {
                form.error = 'Invalid app name, please remove underscore'
                return false;
            }
        }
        form.error = undefined;
        return true;
    }

    /**Deployment manifest block */

    clearManifestData = (e, form) => {
        let manifestForm = form.parent.form.forms[0]
        manifestForm.value = undefined;
        this.reloadForms()
    }

    onManifestLoad = (data, extra) => {
        let form = extra.form
        let manifestForm = form.parent.form.forms[0]
        manifestForm.value = data
        this.reloadForms()
    }

    addManifestData = (e, form) => {
        uploadData(e, this.onManifestLoad, { form: form })
    }

    deploymentManifestForm = () => ([
        { field: localFields.deploymentManifest, formType: TEXT_AREA, rules: { required: false, onBlur: true }, update: { edit: true }, width: 14, visible: true },
        { icon: 'browse', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.addManifestData },
        { icon: 'clear', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.clearManifestData }
    ])

    portForm = () => ([
        { field: localFields.portRangeMax, label: 'Port', formType: INPUT, rules: { required: true, type: 'number', min: 1 }, width: 7, visible: true, update: { edit: true }, dataValidateFunc: this.validatePortRange },
        { field: localFields.protocol, label: 'Protocol', formType: SELECT, placeholder: 'Select', rules: { required: true, allCaps: true }, width: 3, visible: true, options: ['tcp', 'udp'], update: { edit: true } },
        { field: localFields.tls, label: 'TLS', formType: SWITCH, visible: false, value: false, width: 2, update: { edit: true } },
        { field: localFields.skipHCPorts, label: 'Health Check', formType: SWITCH, visible: false, value: false, width: 2, update: { edit: true } },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.removeMultiForm, update: { edit: true } }
    ])

    getPortForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.ports, formType: MULTI_FORM, forms: form ? form : this.portForm(), width: 3, visible: true })
    }

    annotationForm = () => ([
        { field: localFields.key, label: 'Key', formType: INPUT, rules: { required: true }, width: 7, visible: true, update: { edit: true } },
        { field: localFields.value, label: 'Value', formType: INPUT, rules: { required: true }, width: 7, visible: true, update: { edit: true } },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.removeMultiForm }
    ])

    getAnnotationForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.annotationmulti, formType: MULTI_FORM, forms: form ? form : this.annotationForm(), width: 3, visible: true })
    }

    multiPortForm = () => ([
        { field: localFields.portRangeMin, label: 'Port Min', formType: INPUT, rules: { required: true, type: 'number', min: 1 }, width: 3, visible: true, update: { edit: true }, dataValidateFunc: this.validatePortRange },
        { icon: '~', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1 },
        { field: localFields.portRangeMax, label: 'Port Max', formType: INPUT, rules: { required: true, type: 'number', min: 1 }, width: 3, visible: true, update: { edit: true }, dataValidateFunc: this.validatePortRange },
        { field: localFields.protocol, label: 'Protocol', formType: SELECT, placeholder: 'Select', rules: { required: true, allCaps: true }, width: 3, visible: true, options: ['tcp', 'udp'], update: { edit: true } },
        { field: localFields.tls, label: 'TLS', formType: SWITCH, visible: false, value: false, width: 2, update: { edit: true } },
        { field: localFields.skipHCPorts, label: 'Health Check', formType: SWITCH, visible: false, value: false, width: 2, update: { edit: true } },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.removeMultiForm, update: { edit: true } }
    ])

    getMultiPortForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.ports, formType: MULTI_FORM, forms: form ? form : this.multiPortForm(), width: 3, visible: true })
    }

    configForm = () => ([
        { field: localFields.config, label: 'Config', formType: TEXT_AREA, rules: { required: true, rows: 4 }, width: 9, visible: true, update: { edit: true } },
        { field: localFields.kind, label: 'Kind', formType: SELECT, placeholder: 'Select Kind', rules: { required: true }, width: 5, visible: true, options: this.configOptions, update: { edit: true } },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 2, onClick: this.removeMultiForm }
    ])

    getConfigForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.configmulti, formType: MULTI_FORM, forms: form ? form : this.configForm(), width: 3, visible: true })
    }

    outboundConnectionsForm = () => ([
        { field: localFields.ocProtocol, label: 'Protocol', formType: SELECT, placeholder: 'Select', rules: { required: true, allCaps: true }, width: 3, visible: true, options: ['tcp', 'udp', 'icmp'], update: { edit: true } },
        { field: localFields.ocRemoteCIDR, label: 'Remote CIDR', formType: INPUT, rules: { required: true }, width: 4, visible: true, update: { edit: true }, dataValidateFunc: validateRemoteCIDR },
        { field: localFields.ocPortMin, label: 'Port Range Min', formType: INPUT, rules: { required: true, type: 'number', min: 1 }, width: 3, visible: true, update: { edit: true }, dataValidateFunc: this.validateOCPortRange },
        { icon: '~', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1 },
        { field: localFields.ocPortMax, label: 'Port Range Max', formType: INPUT, rules: { required: true, type: 'number', min: 1 }, width: 3, visible: true, update: { edit: true }, dataValidateFunc: this.validateOCPortRange },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.removeMultiForm }
    ])

    getOutboundConnectionsForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.requiredOutboundConnectionmulti, formType: MULTI_FORM, forms: form ? form : this.outboundConnectionsForm(), width: 3, visible: true })
    }

    removeMultiForm = (e, form) => {
        if (form.parent) {
            let updateForms = Object.assign([], this.state.forms)
            updateForms.splice(form.parent.id, 1);
            this.updateState({
                forms: updateForms
            })
        }
    }

    addMultiForm = (e, form) => {
        let parent = form.parent;
        let forms = this.state.forms;
        forms.splice(parent.id + 1, 0, form.multiForm());
        this.updateState({ forms })
    }

    updateImagePath = (forms, form) => {
        if (this.isAdd) {
            let organizationName = undefined;
            let version = undefined
            let deployment = undefined
            let appName = undefined
            for (let form of forms) {
                if (form.field === localFields.organizationName) {
                    organizationName = form.value
                }
                else if (form.field === localFields.version) {
                    version = form.value
                }
                else if (form.field === localFields.deployment) {
                    deployment = form.value
                }
                else if (form.field === localFields.appName) {
                    appName = form.value
                }
            }
            if (deployment && organizationName && appName && version) {
                if (deployment === perpetual.DEPLOYMENT_TYPE_VM) {
                    form.value = `https://artifactory.mobiledgex.net/artifactory/repo-${organizationName}`
                }
                else if (deployment === perpetual.DEPLOYMENT_TYPE_HELM) {
                    form.value = `https://chart.registry.com/charts:${organizationName}/${appName}`
                }
                else {
                    let domain = changeHostName('console', 'docker')
                    if (!Boolean(domain)) {
                        domain = 'docker.mobiledgex.net'
                    }
                    form.value = `${domain}/${organizationName.toLowerCase()}/images/${appName.toLowerCase()}:${version.toLowerCase()}`
                }
            }
        }
    }

    deploymentValueChange = (currentForm, forms, isInit) => {
        forms = forms.filter((form) => {
            if (form.field === localFields.imageType) {
                form.value = currentForm.value === perpetual.DEPLOYMENT_TYPE_HELM ? perpetual.IMAGE_TYPE_HELM :
                    currentForm.value === perpetual.DEPLOYMENT_TYPE_VM ? perpetual.IMAGE_TYPE_QCOW : perpetual.IMAGE_TYPE_DOCKER
                return form
            }
            else if (form.field === localFields.imagePath) {
                this.updateImagePath(forms, form)
                return form
            }
            else if (form.field === localFields.scaleWithCluster) {
                form.visible = currentForm.value === perpetual.DEPLOYMENT_TYPE_KUBERNETES
                return form
            }
            else if (form.field === localFields.configs) {
                form.visible = currentForm.value === perpetual.DEPLOYMENT_TYPE_HELM || currentForm.value === perpetual.DEPLOYMENT_TYPE_KUBERNETES
                this.configOptions = currentForm.value === perpetual.DEPLOYMENT_TYPE_KUBERNETES ? [perpetual.CONFIG_ENV_VAR] : [perpetual.CONFIG_HELM_CUST]
                return form
            }
            else if (form.field === localFields.annotations) {
                form.visible = currentForm.value === perpetual.DEPLOYMENT_TYPE_HELM
                return form
            }
            else if (form.field === localFields.annotationmulti) {
                if (currentForm.value === perpetual.DEPLOYMENT_TYPE_HELM) {
                    return form
                }
            }
            else if (form.field === localFields.configmulti) {
                if (currentForm.value === perpetual.DEPLOYMENT_TYPE_HELM || currentForm.value === perpetual.DEPLOYMENT_TYPE_KUBERNETES) {
                    return form
                }
            }
            else if (form.field === localFields.vmappostype) {
                const deployTypeVM = currentForm.value === perpetual.DEPLOYMENT_TYPE_VM
                form.visible = deployTypeVM
                form.value = deployTypeVM ? form.value : undefined
                return form
            }
            else if (form.field === localFields.allowServerless) {
                form.visible = currentForm.value === perpetual.DEPLOYMENT_TYPE_KUBERNETES
                form.value = false
                this.allowServerLess(form, forms, isInit)
                return form
            }
            else {
                return form
            }
        })
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    getFlavorInfo = async (region, form, forms) => {
        if (region && !this.requestedRegionList.includes(region)) {
            let newList = await getFlavorList(this, { region })
            this.flavorList = [...this.flavorList, ...newList]
        }
        this.updateUI(form)
        this.updateState({ forms })
    }

    getAutoProvPolicy = async (region, form, forms) => {
        if (region && !this.requestedRegionList.includes(region)) {
            let newList = await getAutoProvPolicyList(this, { region })
            this.autoProvPolicyList = [...this.autoProvPolicyList, ...newList]
        }
        this.updateUI(form)
        this.updateState({ forms })
    }

    getAlertPolicy = async (region, form, forms) => {
        if (region && !this.requestedRegionList.includes(region)) {
            let newList = await getAlertPolicyList(this, { region })
            this.alertPolicyList = [...this.alertPolicyList, ...newList]
        }
        this.updateUI(form)
        this.updateState({ forms })
    }

    protcolValueChange = (currentForm, forms, isInit) => {
        let childForms = currentForm.parent.form.forms
        let dependentData = currentForm.parent.form.dependentData

        for (let i = 0; i < childForms.length; i++) {
            let form = childForms[i]
            if (form.field === localFields.tls) {
                form.visible = currentForm.value === 'tcp'
            }
            else if (form.field === localFields.skipHCPorts) {
                form.visible = currentForm.value === 'tcp'
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    regionDependentDataUpdate = (region, forms, isInit) => {
        if (!isInit) {
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                if (form.field === localFields.autoProvPolicies) {
                    this.getAutoProvPolicy(region, form, forms)
                }
                if (form.field === localFields.alertPolicies) {
                    this.getAlertPolicy(region, form, forms)
                }
                else if (form.field === localFields.flavorName) {
                    this.getFlavorInfo(region, form, forms)
                }
            }
        }
    }

    regionValueChange = (currentForm, forms, isInit) => {
        let regions = currentForm.value;
        if (regions && regions.includes('All')) {
            regions = cloneDeep(this.regions)
            regions.splice(0, 1)
        }
        if (!this.isUpdate && regions && regions.length > 0) {
            regions.map(region => {
                this.regionDependentDataUpdate(region, forms, isInit)
                this.requestedRegionList.push(region)
            })
        }
        else {
            let region = this.isUpdate ? currentForm.value : undefined
            this.regionDependentDataUpdate(region, forms, isInit)
        }
    }

    organizationValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i];
            if (form.field === localFields.imagePath) {
                this.updateImagePath(forms, form)
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    versionValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i];
            if (form.field === localFields.imagePath) {
                this.updateImagePath(forms, form)
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    tlsValueChange = (form, forms, isInit) => {
        if (!isInit) {
            this.tlsCount = form.value ? this.tlsCount + 1 : this.tlsCount - 1
        }
    }

    deploymentManifestChange = (currentForm, forms, isInit) => {
        let manifest = currentForm.value
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i];
            if (form.field === localFields.imagePath) {
                let imagePath = form.value
                if ((manifest && manifest.length > 0) && (imagePath && imagePath.length > 0) && !this.imagePathTyped) {
                    this.props.handleAlertInfo('warning', 'Please verify if imagepath is valid, as it was auto generated')
                }
                break;
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    trustedChange = (currentForm, forms, isInit) => {
        forms = forms.filter((form) => {
            if (form.field === localFields.requiredOutboundConnections) {
                form.visible = currentForm.value
                return form
            }
            else if (form.field === localFields.requiredOutboundConnectionmulti) {
                if (currentForm.value) {
                    return form
                }
            }
            else {
                return form
            }
        })
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    allowServerLess = (currentForm, forms, isInit) => {
        this.serverlessMenu = false
        forms = forms.filter((form) => {
            if (form.label === SERVERCONFIG_HEADER) {
                form.visible = currentForm.value
                //reset button icon
                form.forms[0].icon = 'expand_less'
                form.value = undefined
            }
            else if (form.serverless) {
                form.visible = false
                form.value = undefined
            }
            return form
        })
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    ocProtcolValueChange = (currentForm, forms, isInit) => {
        let parentForm = currentForm.parent.form
        let isICMP = currentForm.value === 'icmp'
        for (const form of forms) {
            if (form.uuid === parentForm.uuid) {
                for (let childForm of form.forms) {
                    if (childForm.field === localFields.ocPortMin || childForm.field === localFields.ocPortMax || childForm.icon === '~') {
                        childForm.visible = !isICMP
                        childForm.value = undefined
                    }
                }
                break;
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    qosSessionProfileChange = (currentForm, forms, isInit) => {
        for (let form of forms) {
            if (form.field === localFields.qosSessionDuration) {
                form.visible = currentForm.value !== perpetual.QOS_NO_PRIORITY
                break;
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    checkForms = (form, forms, isInit = false, data) => {
        let flowDataList = []
        if (form.field === localFields.region) {
            this.regionValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.organizationName) {
            this.organizationValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.version || form.field === localFields.appName) {
            this.versionValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.deployment) {
            this.deploymentValueChange(form, forms, isInit)
            let finalData = isInit ? data : formattedData(forms)
            flowDataList.push(appFlow.deploymentTypeFlow(finalData, perpetual.PAGE_APPS))
            flowDataList.push(appFlow.ipAccessFlowApp(finalData))
            flowDataList.push(appFlow.portFlow(this.tlsCount))
        }
        else if (form.field === localFields.imagePath) {
            this.imagePathTyped = true
        }
        else if (form.field === localFields.protocol) {
            this.protcolValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.ocProtocol) {
            this.ocProtcolValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.tls) {
            this.tlsValueChange(form, forms, isInit)
            flowDataList.push(appFlow.portFlow(this.tlsCount))
        }
        else if (form.field === localFields.accessType) {
            let finalData = isInit ? data : formattedData(forms)
            flowDataList.push(appFlow.deploymentTypeFlow(finalData, perpetual.PAGE_APPS))
            flowDataList.push(appFlow.ipAccessFlowApp(finalData))
            flowDataList.push(appFlow.portFlow(this.tlsCount))
        }
        else if (form.field === localFields.deploymentManifest) {
            this.deploymentManifestChange(form, forms, isInit)
        }
        else if (form.field === localFields.trusted) {
            this.trustedChange(form, forms, isInit)
        }
        else if (form.field === localFields.allowServerless) {
            this.allowServerLess(form, forms, isInit)
        }
        else if (form.field === localFields.qosSessionProfile) {
            this.qosSessionProfileChange(form, forms, isInit)
        }
        if (flowDataList.length > 0) {
            if (isInit) {
                this.updateFlowDataList = [...this.updateFlowDataList, ...flowDataList]
            }
            else {
                this.updateState({ showGraph: true, flowDataList: flowDataList })
            }
        }
    }

    validateDecimalInteger = (form) => {
        if (form.value && form.value.length > 0) {
            if (!/^[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)$/.test(form.value) && !Number.isInteger(form.value)) {
                form.error = 'vcpus must be in decimal or integer'
                return false;
            }
        }
        form.error = undefined;
        return true;
    }
    /**Required */
    /*Trigged when form value changes */
    onValueChange = (form) => {
        let forms = this.state.forms;
        this.checkForms(form, forms)
    }

    advanceMenu = (e, form) => {
        this.expandAdvanceMenu = !this.expandAdvanceMenu
        form.icon = this.expandAdvanceMenu ? 'expand_more' : 'expand_less'
        let forms = this.state.forms

        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.advance !== undefined) {
                form.advance = this.expandAdvanceMenu
            }
        }
        this.reloadForms()
    }

    serverlessConfigMenu = (e, form) => {
        this.serverlessMenu = !this.serverlessMenu
        form.icon = this.serverlessMenu ? 'expand_more' : 'expand_less'
        let forms = this.state.forms
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.serverless) {
                form.visible = this.serverlessMenu
            }
        }
        this.reloadForms()
    }

    onUpgradeResponse = (mc) => {
        this.props.handleLoadingSpinner(false)
        if (mc) {
            let responseData = undefined;
            let request = mc.request;
            if (mc.response && mc.response.data) {
                responseData = mc.response.data;
            }
            let labels = [{ label: 'App', field: localFields.appName }]
            this.updateState({ stepsArray: updateStepper(this.state.stepsArray, labels, request.orgData, responseData) })
        }
    }

    onAddResponse = (mcList) => {
        if (mcList && mcList.length > 0) {
            mcList.map(mc => {
                if (mc.response) {
                    let data = mc.request.data;
                    this.props.handleAlertInfo('success', `App ${data.app.key.name} added successfully`)
                    this.props.onClose(true)
                }
            })
        }
    }

    updRangeExceeds = (udpPorts) => {
        let ports = new Set()
        udpPorts.forEach(udp => {
            if (Array.isArray(udp)) {
                let min = parseInt(udp[0])
                let max = parseInt(udp[1])
                for (let i = min; i <= max; i++) {
                    ports.add(i)
                }
            }
            else {
                ports.add(parseInt(udp))
            }
        })
        return ports.size > 1000
    }

    onCreate = async (data) => {
        let valid = true
        if (data) {
            let forms = this.state.forms;
            let ports = ''
            let skipHCPorts = ''
            let annotations = ''
            let requiredOutboundConnections = []
            let configs = []
            let udpPorts = []
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i];
                if (form.uuid) {
                    let uuid = form.uuid;
                    let multiFormData = data[uuid]
                    if (multiFormData) {
                        if (multiFormData[localFields.portRangeMin] && multiFormData[localFields.portRangeMax]) {
                            ports = ports.length > 0 ? ports + ',' : ports
                            let newPort = multiFormData[localFields.protocol].toUpperCase() + ':' + multiFormData[localFields.portRangeMin] + '-' + multiFormData[localFields.portRangeMax]
                            ports = ports + newPort
                            if (multiFormData[localFields.protocol] === 'tcp') {
                                ports = ports + (multiFormData[localFields.tls] ? ':tls' : '')
                                if (!multiFormData[localFields.skipHCPorts]) {
                                    skipHCPorts = skipHCPorts.length > 0 ? skipHCPorts + ',' : skipHCPorts
                                    skipHCPorts = skipHCPorts + newPort
                                }
                            }
                            else if (multiFormData[localFields.protocol] === 'udp') {
                                udpPorts.push([multiFormData[localFields.portRangeMin], multiFormData[localFields.portRangeMax]])
                            }
                        }
                        else if (multiFormData[localFields.portRangeMax]) {
                            ports = ports.length > 0 ? ports + ',' : ports
                            let newPort = multiFormData[localFields.protocol].toUpperCase() + ':' + multiFormData[localFields.portRangeMax]
                            ports = ports + newPort
                            if (multiFormData[localFields.protocol] === 'tcp') {
                                ports = ports + (multiFormData[localFields.tls] ? ':tls' : '')
                                if (!multiFormData[localFields.skipHCPorts] && multiFormData[localFields.protocol] === 'tcp') {
                                    skipHCPorts = skipHCPorts.length > 0 ? skipHCPorts + ',' : skipHCPorts
                                    skipHCPorts = skipHCPorts + newPort
                                }
                            }
                            else if (multiFormData[localFields.protocol] === 'udp') {
                                udpPorts.push(multiFormData[localFields.portRangeMax])
                            }
                        }
                        else if (form.field === localFields.deploymentManifest && multiFormData[localFields.deploymentManifest]) {
                            data[localFields.deploymentManifest] = multiFormData[localFields.deploymentManifest].trim()
                        }
                        else if (multiFormData[localFields.key] && multiFormData[localFields.value]) {
                            annotations = annotations.length > 0 ? annotations + ',' : annotations
                            annotations = annotations + `${multiFormData[localFields.key]}=${multiFormData[localFields.value]}`
                        }
                        else if (multiFormData[localFields.kind] && multiFormData[localFields.config]) {
                            configs.push(multiFormData)
                        }
                        else if (form.field === localFields.requiredOutboundConnectionmulti) {
                            let requiredOutboundConnection = {}
                            requiredOutboundConnection.remote_cidr = multiFormData[localFields.ocRemoteCIDR]
                            if (multiFormData[localFields.ocPortMax]) {
                                requiredOutboundConnection.port_range_max = parseInt(multiFormData[localFields.ocPortMax])
                            }
                            if (multiFormData[localFields.ocPortMin]) {
                                requiredOutboundConnection.port_range_min = parseInt(multiFormData[localFields.ocPortMin])
                            }
                            requiredOutboundConnection.protocol = multiFormData[localFields.ocProtocol]
                            requiredOutboundConnections.push(requiredOutboundConnection)
                        }
                    }
                    data[uuid] = undefined
                }
            }

            if ((data[localFields.imagePath] && data[localFields.imagePath].length > 0) || (data[localFields.deploymentManifest] && data[localFields.deploymentManifest].length > 0)) {
                data[localFields.accessPorts] = ports
                data[localFields.skipHCPorts] = skipHCPorts.length > 0 ? skipHCPorts : undefined

                if (annotations.length > 0) {
                    data[localFields.annotations] = annotations
                }
                if (configs.length > 0) {
                    data[localFields.configs] = configs
                }
                if (requiredOutboundConnections.length > 0) {
                    data[localFields.requiredOutboundConnections] = requiredOutboundConnections
                }

                if (udpPorts.length > 0 && this.updRangeExceeds(udpPorts)) {
                    if (data[localFields.deployment] === perpetual.DEPLOYMENT_TYPE_KUBERNETES) {
                        valid = false
                        this.props.handleAlertInfo('error', 'Maximum 1000 UDP ports are allowed for deployment type kubernetes app')
                    }
                }
                if (valid) {
                    if (this.isUpdate) {
                        let autoProvPolicies = data[localFields.autoProvPolicies]
                        let alertPolicies = data[localFields.alertPolicies]
                        if (autoProvPolicies && autoProvPolicies.length > 0) {
                            data[localFields.autoProvPolicies] = data[localFields.autoProvPolicies][0].value
                        }
                        if (alertPolicies && alertPolicies.length > 0) {
                            data[localFields.alertPolicies] = data[localFields.alertPolicies][0].value
                        }
                        let updateData = updateFieldData(this, forms, data, this.originalData)
                        if (updateData[localFields.trusted] !== undefined) {
                            let roc = this.originalData[localFields.requiredOutboundConnection]
                            if (!updateData[localFields.trusted] && roc && roc.length > 0) {
                                updateData[localFields.fields].push("38", "38.1", "38.2", "38.4")
                            }
                        }
                        if (updateData.fields.length > 0) {
                            let mc = await updateApp(this, updateData)
                            if (responseValid(mc)) {
                                this.props.handleAlertInfo('success', `App ${data[localFields.appName]} updated successfully`)
                                if (data[localFields.refreshAppInst]) {
                                    websocket.request(this, refreshAllAppInst(data), this.onUpgradeResponse, data)
                                }
                                else {
                                    this.props.onClose(true)
                                }
                            }
                        }
                    }
                    else {
                        let regions = data[localFields.region]
                        let requestList = []
                        if (regions.includes('All')) {
                            regions = cloneDeep(this.regions)
                            regions.splice(0, 1)
                        }
                        regions.map(region => {
                            let requestData = cloneDeep(data)
                            requestData[localFields.region] = region
                            requestData[localFields.flavorName] = undefined
                            for (let i = 0; i < data[localFields.flavorName].length; i++) {
                                let flavor = data[localFields.flavorName][i]
                                if (flavor && flavor.parent.includes(region)) {
                                    requestData[localFields.flavorName] = flavor.value
                                    break;
                                }
                            }
                            if (data[localFields.autoProvPolicies]) {
                                requestData[localFields.autoProvPolicies] = undefined
                                for (let i = 0; i < data[localFields.autoProvPolicies].length; i++) {
                                    let autoPolicy = data[localFields.autoProvPolicies][i]
                                    if (autoPolicy && autoPolicy.parent.includes(region)) {
                                        requestData[localFields.autoProvPolicies] = autoPolicy.value
                                        break;
                                    }
                                }
                            }
                            if (data[localFields.alertPolicies]) {
                                requestData[localFields.alertPolicies] = undefined
                                for (let i = 0; i < data[localFields.alertPolicies].length; i++) {
                                    let alertPolicy = data[localFields.alertPolicies][i]
                                    if (alertPolicy && alertPolicy.parent.includes(region)) {
                                        requestData[localFields.alertPolicies] = alertPolicy.value
                                        break;
                                    }
                                }
                            }
                            requestData[localFields.serverLessConfig] = data[localFields.serverLessConfig]
                            requestList.push(createApp(requestData))
                        })

                        if (requestList && requestList.length > 0) {
                            service.multiAuthRequest(this, requestList, this.onAddResponse)
                        }
                    }
                }
            }
            else {
                this.props.handleAlertInfo('error', 'Please input image path or deployment manifest')
            }
        }
    }


    /*Required*/
    reloadForms = () => {
        this.updateState({
            forms: this.state.forms
        })
    }

    onAddCancel = () => {
        this.props.onClose(false)
    }

    resetFormValue = (form) => {
        let rules = form.rules
        if (rules) {
            let disabled = rules.disabled ? rules.disabled : false
            if (!disabled) {
                form.value = undefined;
            }
        }
    }

    updateUI(form) {
        if (form) {
            this.resetFormValue(form)
            if (form.field) {
                if (form.formType === SELECT || form.formType === MULTI_SELECT || form.formType === SELECT_RADIO_TREE) {
                    switch (form.field) {
                        case localFields.region:
                            form.options = this.regions;
                            break;
                        case localFields.organizationName:
                            form.options = this.organizationList
                            break;
                        case localFields.flavorName:
                            form.options = this.flavorList
                            break;
                        case localFields.autoProvPolicies:
                            form.options = this.autoProvPolicyList
                            break;
                        case localFields.alertPolicies:
                            form.options = this.alertPolicyList
                            break;
                        case localFields.vmappostype:
                            form.options = [perpetual.OS_LINUX, perpetual.OS_WINDOWS_10, perpetual.OS_WINDOWS_2012, perpetual.OS_WINDOWS_2016, perpetual.OS_WINDOWS_2019]
                            break;
                        case localFields.deployment:
                            form.options = [perpetual.DEPLOYMENT_TYPE_DOCKER, perpetual.DEPLOYMENT_TYPE_KUBERNETES, perpetual.DEPLOYMENT_TYPE_VM, perpetual.DEPLOYMENT_TYPE_HELM]
                            break;
                        case localFields.qosSessionProfile:
                            form.options = [perpetual.QOS_LOW_LATENCY, perpetual.QOS_NO_PRIORITY, perpetual.QOS_THROUGHPUT_DOWN_S, perpetual.QOS_THROUGHPUT_DOWN_M, perpetual.QOS_THROUGHPUT_DOWN_L]
                            break;
                        default:
                            form.options = undefined;
                    }
                }
            }
        }
    }

    formKeys = () => {
        return [
            { label: `${this.isUpdate ? 'Update' : 'Create'} Apps`, formType: MAIN_HEADER, visible: true },
            { field: localFields.region, label: 'Region', formType: this.isUpdate ? SELECT : MULTI_SELECT, placeholder: 'Select Region', rules: { required: true }, visible: true, tip: 'Allows developer to upload app info to different controllers', update: { key: true } },
            { field: localFields.organizationName, label: 'Organization', formType: SELECT, placeholder: 'Select Developer', rules: { required: redux_org.isAdmin(this), disabled: !redux_org.isAdmin(this) }, value: redux_org.nonAdminOrg(this), visible: true, tip: 'Organization or Company Name that a Developer is part of', update: { key: true } },
            { field: localFields.appName, label: 'App Name', formType: INPUT, placeholder: 'Enter App Name', rules: { required: true, onBlur: true }, visible: true, tip: 'App name', dataValidateFunc: this.validateAppName, update: { key: true } },
            { field: localFields.version, label: 'App Version', formType: INPUT, placeholder: 'Enter App Version', rules: { required: true, onBlur: true }, visible: true, tip: 'App version', update: { key: true } },
            { field: localFields.deployment, label: 'Deployment Type', formType: SELECT, placeholder: 'Select Deployment Type', rules: { required: true }, visible: true, tip: 'Deployment type (Kubernetes, Docker, or VM)' },
            { field: localFields.vmappostype, label: 'VM App OS Type', formType: SELECT, placeholder: 'Select OS Type', rules: { required: false }, visible: false, update: { id: ['41'] }, tip: 'OS Type for VM Apps, one of Linux, Windows 10, Windows 2012, Windows 2016, Windows 2019' },
            { field: localFields.imageType, label: 'Image Type', formType: INPUT, placeholder: 'Select Image Type', rules: { required: true, disabled: true }, visible: true, tip: 'ImageType specifies image type of an App' },
            { field: localFields.imagePath, label: 'Image Path', formType: INPUT, placeholder: 'Enter Image Path', rules: { required: false }, visible: true, update: { id: ['4'] }, tip: 'URI of where image resides' },
            { field: localFields.flavorName, label: 'Default Flavor', formType: this.isUpdate ? SELECT : SELECT_RADIO_TREE, placeholder: 'Select Flavor', rules: { required: true, copy: true }, visible: true, update: { id: ['9.1'] }, tip: 'FlavorKey uniquely identifies a Flavor.', dependentData: [{ index: 1, field: localFields.region }] },
            { field: localFields.autoProvPolicies, showField: localFields.autoPolicyName, label: 'Auto Provisioning Policies', formType: SELECT_RADIO_TREE, placeholder: 'Select Auto Provisioning Policies', rules: { required: false }, visible: true, update: { id: ['32'] }, multiple: true, tip: 'Auto provisioning policies', dependentData: [{ index: 1, field: localFields.region }, { index: 2, field: localFields.organizationName }] },
            { uuid: uniqueId(), field: localFields.deploymentManifest, label: 'Deployment Manifest', formType: TEXT_AREA, visible: true, update: { id: ['16'] }, forms: this.deploymentManifestForm(), tip: 'Deployment manifest is the deployment specific manifest file/config For docker deployment, this can be a docker-compose or docker run file For kubernetes deployment, this can be a kubernetes yaml or helm chart file' },
            { field: localFields.refreshAppInst, label: 'Upgrade All App Instances', formType: SWITCH, visible: this.isUpdate, value: false, update: { edit: true }, tip: 'Upgrade App Instances running in the cloudlets' },
            { field: localFields.trusted, label: 'Trusted', formType: SWITCH, visible: true, value: false, update: { id: ['37'] }, tip: 'Indicates that an instance of this app can be started on a trusted cloudlet' },
            { field: localFields.allowServerless, label: 'Allow Serverless', formType: SWITCH, value: false, tip: 'App is allowed to deploy as serverless containers', visible: false, rules: { disabled: false }, update: { id: ['39'] } },
            { field: localFields.accessPorts, label: 'Ports', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Add Port Mappings', icon: 'add', visible: true, onClick: this.addMultiForm, multiForm: this.getPortForm }, { formType: ICON_BUTTON, label: 'Add Multiport Mappings', icon: 'add_mult', visible: true, onClick: this.addMultiForm, multiForm: this.getMultiPortForm }], update: { id: ['7'], ignoreCase: true }, visible: true, tip: 'Ports:</b>Comma separated list of protocol:port pairs that the App listens on i.e. TCP:80,UDP:10002,http:443\nHealth Check:</b> Periodically tests the health of applications as TCP packets are generated from the load balancer to the application and its associated port. This information is useful for Developers to manage and mitigate issues.' },
            { field: localFields.configs, label: 'Configs', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Add Configs', icon: 'add', visible: true, onClick: this.addMultiForm, multiForm: this.getConfigForm }], visible: false, update: { id: ['21', '21.1', '21.2'] }, tip: 'Customization files passed through to implementing services' },
            { field: localFields.annotations, label: 'Annotations', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Add Annotations', icon: 'add', visible: true, onClick: this.addMultiForm, multiForm: this.getAnnotationForm }], visible: false, update: { id: ['14'] }, tip: 'Annotations is a comma separated map of arbitrary key value pairs' },
            { field: localFields.requiredOutboundConnections, label: 'Required Outbound Connections', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Add Connections', icon: 'add', visible: true, onClick: this.addMultiForm, multiForm: this.getOutboundConnectionsForm }], visible: false, update: { id: ['38', '38.1', '38.2', '38.4'] }, tip: 'Connections this app require to determine if the app is compatible with a trust policy' },
            { label: SERVERCONFIG_HEADER, formType: HEADER, visible: false, forms: [{ formType: ICON_BUTTON, icon: 'expand_less', visible: true, onClick: this.serverlessConfigMenu }], visible: false },
            { field: localFields.serverlessVcpu, label: 'Virtual CPU', formType: INPUT, placeholder: 'Enter vCPUs per container', rules: { required: false }, visible: false, update: { id: ['40', '40.1'] }, dataValidateFunc: this.validateDecimalInteger, serverless: true, tip: 'Virtual CPUs allocation per container when serverless, may be decimal in increments of 0.001' },
            { field: localFields.serverlessRam, label: 'RAM', formType: INPUT, placeholder: 'Enter RAM allocation per container', rules: { required: false, type: 'number' }, visible: false, update: { id: ['40', '40.2'] }, serverless: true, tip: 'RAM allocation in megabytes per container when serverless' },
            { field: localFields.serverlessMinReplicas, label: 'Min Replicas', formType: INPUT, placeholder: 'Enter min replicas', rules: { required: false, type: 'number' }, visible: false, update: { id: ['40', '40.3'] }, serverless: true, tip: 'Minimum number of replicas when serverless' },
            { label: 'Advanced Settings', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Advance Options', icon: 'expand_less', visible: true, onClick: this.advanceMenu }], visible: true },
            { field: localFields.authPublicKey, label: 'Auth Public Key', formType: TEXT_AREA, placeholder: 'Enter Auth Public Key', rules: { required: false }, visible: true, update: { id: ['12'] }, tip: 'public key used for authentication', advance: false },
            { field: localFields.alertPolicies, showField: localFields.alertPolicyName, label: 'Alert Policies', formType: SELECT_RADIO_TREE, placeholder: 'Select Alert Policies', rules: { required: false }, visible: true, update: { id: ['42'] }, multiple: true, tip: 'Alert policies', dependentData: [{ index: 1, field: localFields.region }, { index: 2, field: localFields.organizationName }], advance: false },
            { field: localFields.officialFQDN, label: 'Official FQDN', formType: INPUT, placeholder: 'Enter Official FQDN', rules: { required: false }, visible: true, update: { id: ['25'] }, tip: 'Official FQDN is the FQDN that the app uses to connect by default', advance: false },
            { field: localFields.androidPackageName, label: 'Android Package Name', formType: INPUT, placeholder: 'Enter Package Name', rules: { required: false }, visible: true, update: { id: ['18'] }, tip: 'Android package name used to match the App name from the Android package', advance: false },
            { field: localFields.scaleWithCluster, label: 'Scale With Cluster', formType: SWITCH, visible: false, value: false, update: { id: ['22'] }, advance: false, tip: 'Option to run App on all nodes of the cluster' },
            { field: localFields.command, label: 'Command', formType: INPUT, placeholder: 'Enter Command', rules: { required: false }, visible: true, update: { id: ['13'] }, tip: 'Command that the container runs to start service', advance: false },
            { field: localFields.templateDelimiter, label: 'Template Delimeter', formType: INPUT, placeholder: 'Enter Template Delimeter', rules: { required: false }, visible: true, update: { id: ['33'] }, tip: 'Delimiter to be used for template parsing, defaults to [[ ]]', advance: false },
            { field: localFields.qosSessionProfile, label: 'QOS Network Prioritization', formType: SELECT, placeholder: 'Select Profile', visible: true, update: { id: ['43'] }, tip: 'Qualifier for the requested latency profile, one of NoPriority, LowLatency, ThroughputDownS, ThroughputDownM, ThroughputDownL', advance: false },
            { field: localFields.qosSessionDuration, label: 'QOS Session Duration', formType: TIME_COUNTER, placeholder: 'Enter Duration', rules: { required: false, onBlur: true }, visible: false, update: { id: ['44'] }, tip: 'Session duration in seconds. Maximal value of 24 hours is used if not set', default: '24h', advance: false },
            { field: localFields.skipHCPorts, update: { id: ['34'], ignoreCase: true } },
        ]
    }

    loadDefaultData = async (forms, data) => {
        if (data) {
            let requestList = []
            let organization = {}
            let region = data[localFields.region]
            organization[localFields.organizationName] = data[localFields.organizationName];
            this.organizationList = [organization]

            if (region) {
                requestList.push(showAppInsts(this, { region: region, appinst: { key: { app_key: { organization: data[localFields.organizationName], name: data[localFields.appName], version: data[localFields.version] } } } }, true))
                requestList.push(showFlavors(this, { region: region }))
                requestList.push(showAutoProvPolicies(this, { region: region }))
                requestList.push(showAlertPolicy(this, { region: region }))
            }
            let mcList = await service.multiAuthSyncRequest(this, requestList)
            if (mcList && mcList.length > 0) {
                for (const mc of mcList) {
                    let method = mc.request.method;
                    let responseData = mc.response.data
                    if (method === endpoint.SHOW_FLAVOR) {
                        this.flavorList = responseData
                    }
                    else if (method === endpoint.SHOW_AUTO_PROV_POLICY) {
                        this.autoProvPolicyList = responseData
                    }
                    else if (method === endpoint.SHOW_ALERT_POLICY) {
                        this.alertPolicyList = responseData
                    }
                    else if (method === endpoint.SHOW_APP_INST) {
                        this.appInstExist = responseData.length > 0
                    }
                }
            }

            if (data[localFields.deployment] === perpetual.DEPLOYMENT_TYPE_KUBERNETES) {
                this.configOptions = [perpetual.CONFIG_ENV_VAR]
            }

            let multiFormCount = 0
            let indexs = findIndexs(forms, [localFields.accessPorts, localFields.configs, localFields.annotations, localFields.requiredOutboundConnections])

            for (let form of forms) {
                if (data[localFields.accessPorts] && form.field === localFields.accessPorts) {
                    let portArray = data[localFields.accessPorts].split(',')
                    let skipHCPortArray = data[localFields.skipHCPorts] ? data[localFields.skipHCPorts].split(',') : []
                    for (let ports of portArray) {
                        let portInfo = ports.split(':')
                        let protocol = portInfo[0].toLowerCase();
                        let portMaxNo = portInfo[1];
                        let tls = false
                        let skipHCPort = skipHCPortArray.includes(ports.replace(':tls', ''))
                        if (portInfo.length === 3 && portInfo[2] === 'tls') {
                            tls = true
                        }
                        let portMinNo = undefined

                        let portForms = this.portForm()

                        if (portMaxNo.includes('-')) {
                            portForms = this.multiPortForm()
                            let portNos = portMaxNo.split('-')
                            portMinNo = portNos[0]
                            portMaxNo = portNos[1]
                        }

                        for (let portForm of portForms) {
                            if (portForm.field === localFields.protocol) {
                                portForm.value = protocol
                            }
                            else if (portForm.field === localFields.portRangeMax) {
                                portForm.value = portMaxNo
                            }
                            else if (portForm.field === localFields.portRangeMin) {
                                portForm.value = portMinNo
                            }
                            else if (portForm.field === localFields.tls) {
                                portForm.visible = protocol === 'tcp'
                                portForm.value = tls
                            }
                            else if (portForm.field === localFields.skipHCPorts) {
                                portForm.visible = protocol === 'tcp'
                                portForm.value = !skipHCPort
                            }
                        }
                        forms.splice(indexs[form.field] + multiFormCount, 0, this.getPortForm(portForms))
                        multiFormCount++
                    }
                }
                else if (data[localFields.configs] && form.field === localFields.configs) {
                    let configs = data[localFields.configs]
                    for (let config of configs) {
                        let configForms = this.configForm()
                        for (let configForm of configForms) {
                            if (configForm.field === localFields.kind) {
                                configForm.value = config[localFields.kind]
                            }
                            else if (configForm.field === localFields.config) {
                                configForm.value = config[localFields.config]
                            }
                        }
                        forms.splice(indexs[form.field] + multiFormCount, 0, this.getConfigForm(configForms))
                        multiFormCount++
                    }
                }
                else if (data[localFields.annotations] && localFields.annotations === form.field) {
                    let annotationArray = data[localFields.annotations].split(',')
                    for (let annotation of annotationArray) {
                        let annotations = annotation.split('=')
                        let annotationForms = this.annotationForm()
                        let key = annotations[0]
                        let value = annotations[1]

                        for (let annotationForm of annotationForms) {
                            if (annotationForm.field === localFields.key) {
                                annotationForm.value = key
                            }
                            else if (annotationForm.field === localFields.value) {
                                annotationForm.value = value
                            }
                        }
                        forms.splice(indexs[form.field] + multiFormCount, 0, this.getAnnotationForm(annotationForms))
                        multiFormCount++
                    }
                }
                else if (data[localFields.requiredOutboundConnections] && localFields.requiredOutboundConnections === form.field) {
                    let requiredOutboundConnections = data[localFields.requiredOutboundConnections]
                    for (let requiredOutboundConnection of requiredOutboundConnections) {
                        let outboundConnectionsForms = this.outboundConnectionsForm()
                        for (let outboundConnectionsForm of outboundConnectionsForms) {
                            if (outboundConnectionsForm.field === localFields.ocProtocol) {
                                outboundConnectionsForm.value = requiredOutboundConnection['protocol']
                            }
                            else if (outboundConnectionsForm.field === localFields.ocRemoteCIDR) {
                                outboundConnectionsForm.value = requiredOutboundConnection['remote_cidr']
                            }
                            else if (outboundConnectionsForm.field === localFields.ocPortMin) {
                                outboundConnectionsForm.visible = requiredOutboundConnection['protocol'] !== 'icmp'
                                outboundConnectionsForm.value = requiredOutboundConnection['port_range_min']
                            }
                            else if (outboundConnectionsForm.field === localFields.ocPortMax) {
                                outboundConnectionsForm.visible = requiredOutboundConnection['protocol'] !== 'icmp'
                                outboundConnectionsForm.value = requiredOutboundConnection['port_range_max']
                            }
                        }
                        forms.splice(indexs[form.field] + multiFormCount, 0, this.getOutboundConnectionsForm(outboundConnectionsForms))
                        multiFormCount++
                    }
                }
            }
        }
    }

    updateFormData = (forms, data) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            this.updateUI(form)
            if (data) {

                if (form.field === localFields.refreshAppInst) {
                    form.visible = this.appInstExist && (data[localFields.deployment] !== perpetual.DEPLOYMENT_TYPE_VM)
                }
                if (form.forms && form.formType !== HEADER && form.formType !== MULTI_FORM) {
                    this.updateFormData(form.forms, data)
                }
                else {
                    if (form.formType === SELECT_RADIO_TREE) {
                        if (data[form.field]) {
                            let parent = ''
                            form.dependentData.map(dependent => {
                                parent = parent + data[dependent.field] + ' '
                            })
                            form.value = [{ parent, value: data[form.field] }]
                        }
                    }
                    else {
                        form.value = data[form.field]
                    }
                    this.checkForms(form, forms, true, data)
                }

                if (this.appInstExist === false) {
                    if (form.field == localFields.deployment) {
                        form.update = { id: ['15'] }
                    }
                }
            }
        }

    }

    getFormData = async (data) => {
        let forms = this.formKeys()
        if (data) {
            if (data[localFields.accessServerlessConfig]) {
                data[localFields.serverlessVcpu] = data[localFields.accessServerlessConfig]['vcpus']
                data[localFields.serverlessRam] = data[localFields.accessServerlessConfig]['ram']
                data[localFields.serverlessMinReplicas] = data[localFields.accessServerlessConfig]['min_replicas']
            }
            this.tlsCount = data[localFields.accessPorts] ? (data[localFields.accessPorts].match(/tls/g) || []).length : 0;
            this.updateFlowDataList.push(appFlow.portFlow(this.tlsCount))
            this.originalData = cloneDeep(data)
            await this.loadDefaultData(forms, data)
            if (this.isClone) {

                this.requestedRegionList.push(data[localFields.region])
                data[localFields.region] = [data[localFields.region]]
                //clear manifest if auto generated
                if (data[localFields.deploymentGenerator] === 'kubernetes-basic') {
                    data[localFields.deploymentManifest] = undefined
                }
            }
        }

        if (!this.isUpdate) {
            this.organizationList = await getOrganizationList(this, { type: perpetual.DEVELOPER })
        }

        forms.push(
            { label: this.isUpdate ? 'Update' : 'Create', formType: BUTTON, onClick: this.onCreate, validate: true },
            { label: 'Cancel', formType: BUTTON, onClick: this.onAddCancel })

        this.updateFormData(forms, data)
        this.updateState({
            forms
        })

        if (this.isUpdate) {
            this.updateState({
                showGraph: true,
                flowDataList: this.updateFlowDataList
            })
        }

    }

    stepperClose = () => {
        this.updateState({
            stepsArray: []
        })
        this.props.onClose(true)
    }

    render() {
        return (
            <Fragment>
                <Grid container>
                    <Grid item xs={this.state.showGraph ? 8 : 12}>
                        <div className="round_panel">
                            <MexForms forms={this.state.forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} isUpdate={this.isUpdate} />
                        </div>
                    </Grid>
                    {this.state.showGraph ? <Grid item xs={4} style={{ borderRadius: 5, backgroundColor: 'transparent' }}>
                        <Suspense fallback={<div></div>}>
                            <MexFlow flowDataList={this.state.flowDataList} flowObject={appFlow} />
                        </Suspense>
                    </Grid> : null}
                </Grid>
                <MexMultiStepper multiStepsArray={this.state.stepsArray} onClose={this.stepperClose} />
            </Fragment>
        )
    }

    componentDidMount() {
        this._isMounted = true
        this.getFormData(cloneDeep(this.props.data))
        this.props.handleViewMode(HELP_APP_REG)
    }

    componentWillUnmount() {
        this._isMounted = false
    }

};

const mapStateToProps = (state) => {
    return {
        regions: state.regionInfo.region,
        organizationInfo: state.organizationInfo.data
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleViewMode: (data) => { dispatch(actions.viewMode(data)) }
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(AppReg));