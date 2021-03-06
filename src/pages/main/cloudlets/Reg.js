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

import React, { Suspense } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
//Mex
import MexForms, { SELECT, MULTI_SELECT, INPUT, TEXT_AREA, ICON_BUTTON, formattedData, MAIN_HEADER, HEADER, MULTI_FORM, TIP, SWITCH, findIndexs, clearMultiForms } from '../../../hoc/forms/MexForms';
import ListMexMap from '../../../hoc/datagrid/map/ListMexMap';
import MexMultiStepper, { updateStepper } from '../../../hoc/stepper/MexMessageMultiStream'
import * as cloudletFLow from '../../../hoc/mexFlow/cloudletFlow'
import MexTab from '../../../hoc/forms/tab/MexTab';
import { redux_org } from '../../../helper/reduxData'
//model
import { service, updateFieldData, endpoint } from '../../../services';
import { showOrganizations } from '../../../services/modules/organization';
import { createCloudlet, updateCloudlet, getCloudletManifest, cloudletResourceQuota, cloudletProps } from '../../../services/modules/cloudlet';
import { showTrustPolicies } from '../../../services/modules/trustPolicy';
import { HELP_CLOUDLET_REG } from "../../../tutorial";
import { Grid } from '@material-ui/core';
import { perpetual } from '../../../helper/constant';
import { componentLoader } from '../../../hoc/loader/componentLoader';
import { showGPUDrivers } from '../../../services/modules/gpudriver';
import { showAuthSyncRequest } from '../../../services/service';
import { _sort } from '../../../helper/constant/operators';
import { uniqueId } from '../../../helper/constant/shared';
import { responseValid } from '../../../services/config';
import { localFields } from '../../../services/fields';

const MexFlow = React.lazy(() => componentLoader(import('../../../hoc/mexFlow/MexFlow')));
const CloudletManifest = React.lazy(() => componentLoader(import('./CloudletManifest')));

const fetchFormValue = (forms, field) => {
    let value = undefined
    for (const form of forms) {
        if (form.field === field) {
            value = form.value
            break;
        }
    }
    return value
}

class CloudletReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 0,
            forms: [],
            mapData: [],
            stepsArray: [],
            cloudletManifest: undefined,
            showCloudletManifest: false,
            showManifest: false,
            activeIndex: 0,
            flowDataList: [],
            flowInstance: undefined,
            region: undefined
        }
        this._isMounted = false
        this.isUpdate = this.props.isUpdate
        this.infraApiAccessList = [perpetual.INFRA_API_ACCESS_DIRECT]
        //To avoid refeching data from server
        this.requestedRegionList = [];
        this.operatorList = [];
        this.cloudletData = undefined;
        this.canCloseStepper = true;
        this.restricted = false;
        this.updateFlowDataList = [];
        this.expandAdvanceMenu = false;
        this.trustPolicyList = [];
        this.resourceQuotaList = [];
        this.cloudletPropsList = [];
        this.gpuDriverList = [];
        this.kafkaRequired = true;
        this.developerOrgList = []
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    updateResoursceQuotaList = (dataList) => {
        this.resourceQuotaList = dataList.map(quota => {
            quota[localFields.resourceName] = quota.name
            return quota
        })
    }

    // load dynamic tooltip for environments variables
    loadEnvTip = (data) => {
        const { key, name, value, description } = data
        if (description) {
            return `Name:</b> ${name ?? key}\n${description ? 'Description' : ''}</b> ${description ?? ''}`
        }
    }

    readResourceQuotaUnit = (description)=>{
        let start = description.indexOf('(')
        let unit = undefined
        if (start >= 0) {
            let end = description.indexOf(')')
            unit = description.substring(start + 1, end)
        }
        return unit
    }

    fetchRegionDependentData = async (region, platformType) => {
        let requestList = []
        if (region) {
            if (!this.requestedRegionList.includes(region)) {
                requestList.push(showTrustPolicies(this, { region }))
                requestList.push(showGPUDrivers(this, { region }))
            }
            if (platformType) {
                requestList.push(cloudletResourceQuota(this, { region, platformType }))
                requestList.push(cloudletProps(this, { region, platformType }))
            }

            if (requestList.length > 0) {
                let mcList = await service.multiAuthSyncRequest(this, requestList)
                if (mcList && mcList.length > 0) {
                    mcList.forEach(mc => {
                        if (responseValid(mc)) {
                            let method = mc.request.method
                            let data = mc.response.data
                            if (data) {
                                if (data.length > 0) {
                                    if (method === endpoint.SHOW_TRUST_POLICY) {
                                        this.trustPolicyList = [...this.trustPolicyList, ...data]
                                    }
                                    else if (method === endpoint.SHOW_GPU_DRIVER) {
                                        this.gpuDriverList = [...this.gpuDriverList, ...data]
                                    }
                                    else if (method === endpoint.GET_CLOUDLET_PROPS) {
                                        this.cloudletPropsList = data
                                    }
                                }
                                else if (method === endpoint.GET_CLOUDLET_RESOURCE_QUOTA_PROPS) {
                                    if (data.properties) {
                                        this.updateResoursceQuotaList(data.properties)
                                    }
                                }
                            }
                        }
                    })
                }
            }
        }
    }

    loadEnvMandatoryForms = (forms) => {
        let index = findIndexs(forms, localFields.envVars)
        let multiFormCount = 0
        this.cloudletPropsList.forEach((item, i) => {
            if (item.mandatory) {
                let multiForms = this.envForm()
                let key = item.key
                let value = item.value
                for (let multiForm of multiForms) {
                    if (multiForm.field === localFields.key) {
                        multiForm.value = key
                        multiForm.rules.disabled = true
                    }
                    else if (multiForm.field === localFields.value) {
                        multiForm.value = value
                    }
                    else if (multiForm.formType === TIP) {
                        multiForm.tip = this.loadEnvTip(item)
                    }
                    else {
                        multiForm.visible = false
                    }
                }
                forms.splice(index + multiFormCount, 0, this.getEnvForm(multiForms))
                multiFormCount++
            }
        })
    }

    getDeveloperOrg = async (form, forms, isInit) => {
        if (!isInit) {
            if (this.developerOrgList.length === 0) {
                this.developerOrgList = await showAuthSyncRequest(self, showOrganizations(self, { type: perpetual.DEVELOPER }, true))
                this.developerOrgList = this.developerOrgList.sort()
            }
            this.updateUI(form)
        }
    }

    platformTypeValueChange = async (currentForm, forms, isInit) => {
        const valid = !isInit
        if (currentForm.value !== undefined && valid) {
            await this.fetchRegionDependentData(this.state.region, currentForm.value)
        }

        forms = clearMultiForms(forms, [localFields.envVar, localFields.resourceQuota])

        for (let form of forms) {
            if (form.field === localFields.deployment && !isInit) {
                this.updateUI(form)
            }
            else if (form.field === localFields.platformHighAvailability && !isInit) {
                form.visible = false
                form.value = false
            }
            else if (form.field === localFields.infraApiAccess) {
                let isOpenStack = currentForm.value === perpetual.PLATFORM_TYPE_OPEN_STACK
                this.infraApiAccessList = [perpetual.INFRA_API_ACCESS_DIRECT]
                if (isOpenStack) {
                    this.infraApiAccessList.push(perpetual.INFRA_API_ACCESS_RESTRICTED)
                }
                form.value = ~isOpenStack ? perpetual.INFRA_API_ACCESS_DIRECT : undefined
                form.rules.disabled = !isOpenStack
                this.updateUI(form)
            }
            else if (form.field === localFields.openRCData || form.field === localFields.caCertdata) {
                form.visible = currentForm.value === perpetual.PLATFORM_TYPE_OPEN_STACK
            }
            else if (form.field === localFields.vmPool) {
                form.visible = currentForm.value === perpetual.PLATFORM_TYPE_VMPOOL
                form.rules.required = form.visible
            }
            else if (form.field === localFields.singleK8sClusterOwner) {
                form.visible = currentForm.value === perpetual.PLATFORM_TYPE_K8S_BARE_METAL
                form.visible && this.getDeveloperOrg(form, forms, isInit)
            }
        }

        if (valid) {
            if (currentForm.value !== undefined && this.state.region) {
                this.loadEnvMandatoryForms(forms)
            }
        }

        this.updateState({ forms }) 
    }

    infraAPIAccessChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === localFields.infraFlavorName || form.field === localFields.infraExternalNetworkName) {
                form.rules.required = currentForm.value === perpetual.INFRA_API_ACCESS_RESTRICTED
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    locationChange = (currentForm, forms, isInit) => {
        if (!isInit) {
            let parentForm = currentForm.parent.form
            let childForms = parentForm.forms
            let latitude = undefined
            let longitude = undefined
            for (let i = 0; i < childForms.length; i++) {
                let form = childForms[i]
                if (form.field === localFields.latitude) {
                    latitude = form.value
                }
                else if (form.field === localFields.longitude) {
                    longitude = form.value
                }
            }
            if (latitude && longitude) {
                let cloudlet = {}
                cloudlet.cloudletLocation = { latitude, longitude }
                this.updateState({ mapData: [cloudlet] })
            }
            else {
                this.updateState({ mapData: [] })
            }
        }
    }

    regionValueChange = async (currentForm, forms, isInit) => {
        let region = currentForm.value;
        this.updateState({ region })
        if (region && !isInit) {
            const platformType = fetchFormValue(forms, localFields.platformType)
            await this.fetchRegionDependentData(region, platformType)
            forms = clearMultiForms(forms, [localFields.envVar, localFields.resourceQuotas])
            for (let form of forms) {
                if (form.field === localFields.trustPolicyName || form.field === localFields.gpuConfig) {
                    this.updateUI(form)
                }
            }
            this.loadEnvMandatoryForms(forms)
            this.updateState({ forms })
            this.requestedRegionList.push(region);
        }
    }

    operatorValueChange = (currentForm, forms, isInit) => {
        for (let form of forms) {
            if (form.field === localFields.trustPolicyName) {
                this.updateUI(form)
                this.updateState({ forms })
            }
        }
    }

    deploymentValueChange = (currentForm, forms, isInit) => {
        let valid;
        for (let form of forms) {
            if (form.field === localFields.platformType) {
                valid = [perpetual.PLATFORM_TYPE_VCD, perpetual.PLATFORM_TYPE_OPEN_STACK].includes(form.value)
            }
            else if (form.field === localFields.platformHighAvailability) {
                form.visible = (currentForm.value === perpetual.DEPLOYMENT_TYPE_KUBERNETES && valid)
                form.value = false
            }
        }
        if (!isInit) {
            this.updateState({ forms })
        }
    }

    kafkaChange = (currentForm, forms, isInit) => {
        let inputValid = false
        for (let form of forms) {
            if (inputValid) {
                continue;
            }
            else if (form.field === localFields.kafkaCluster || form.field === localFields.kafkaUser || form.field === localFields.kafkaPassword) {
                inputValid = Boolean(form.value)
            }
        }
        for (let form of forms) {
            if (form.field === localFields.kafkaCluster || form.field === localFields.kafkaUser || form.field === localFields.kafkaPassword) {
                form.rules.required = inputValid && this.kafkaRequired
            }
        }
        this.updateState({ forms })
    }

    onCloudletPropsKeyChange = (currentForm, forms, isInit) => {
        let keyData = undefined
        for (const item of this.cloudletPropsList) {
            if (item[currentForm.field] === currentForm.value) {
                keyData = item
                break;
            }
        }
        if (keyData) {
            let parentForm = currentForm.parent.form
            for (let form of forms) {
                if (form.uuid === parentForm.uuid) {
                    for (let childForm of form.forms) {
                        if (childForm.field === localFields.value) {
                            childForm.value = keyData.value
                        }
                        else if (childForm.formType === TIP) {
                            childForm.tip = this.loadEnvTip(keyData)
                        }
                    }
                    break;
                }
            }
            this.updateState({ forms })
        }
    }

    onResourceQuotaChange = (currentForm, forms, isInit) => {
        let keyData = undefined
        for (const item of this.resourceQuotaList) {
            if (item[currentForm.field] === currentForm.value) {
                keyData = item
                break;
            }
        }
        if (keyData) {
            let description = keyData[localFields.description]
            let parentForm = currentForm.parent.form
            for (let form of forms) {
                if (form.uuid === parentForm.uuid) {
                    for (let childForm of form.forms) {
                        if (childForm.formType === TIP) {
                            childForm.tip = description
                        }
                        else if (childForm.field === localFields.resourceValue) {
                            childForm.unit = this.readResourceQuotaUnit(description)
                        }
                    }
                    break;
                }
            }
            this.updateState({ forms })
        }
    }

    checkForms = (form, forms, isInit = false, data) => {
        let flowDataList = []
        if (form.field === localFields.region) {
            this.regionValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.operatorName) {
            this.operatorValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.platformType) {
            this.platformTypeValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.latitude || form.field === localFields.longitude) {
            this.locationChange(form, forms, isInit)
        }
        else if (form.field === localFields.deployment) {
            this.deploymentValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.infraApiAccess) {
            this.infraAPIAccessChange(form, forms, isInit)
            let finalData = isInit ? data : formattedData(forms)
            flowDataList.push(cloudletFLow.privateFlow(finalData))
        }
        else if (form.field === localFields.kafkaCluster || form.field === localFields.kafkaUser || form.field === localFields.kafkaPassword) {
            this.kafkaChange(form, forms, isInit)
        }
        else if (form.field === localFields.key) {
            this.onCloudletPropsKeyChange(form, forms, isInit)
        }
        else if (form.field === localFields.resourceName) {
            this.onResourceQuotaChange(form, forms, isInit)
        }

        if (flowDataList.length > 0) {
            if (isInit) {
                this.updateFlowDataList = [...this.updateFlowDataList, ...flowDataList]
            }
            else {
                this.updateState({ flowDataList: flowDataList, activeIndex: 1 })
            }
        }
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

    onCreateResponse = async (mc) => {
        if (mc) {
            this.props.handleLoadingSpinner(false)
            if (mc.close && this.state.stepsArray.length === 0) {
                this.props.handleAlertInfo('success', 'Cloudlet updated successfully')
                this.props.onClose(true)
            }
            else {
                let responseData = undefined;
                let request = mc.request;
                if (mc.response && mc.response.data) {
                    responseData = mc.response.data;
                }
                let orgData = request.orgData;
                let isRestricted = orgData[localFields.infraApiAccess] === perpetual.INFRA_API_ACCESS_RESTRICTED

                let labels = [{ label: 'Cloudlet', field: localFields.cloudletName }]
                if (!this.isUpdate && isRestricted) {
                    this.restricted = true
                    if (responseData && responseData.data && responseData.data.message === 'Cloudlet configured successfully. Please run `GetCloudletManifest` to bringup Platform VM(s) for cloudlet services') {
                        responseData.data.message = 'Cloudlet configured successfully, please wait requesting cloudlet manifest to bring up Platform VM(s) for cloudlet service'
                        this.updateState({ stepsArray: updateStepper(this.state.stepsArray, labels, request.orgData, responseData) })
                        let cloudletManifest = await getCloudletManifest(this, orgData, false)
                        this.cloudletData = orgData
                        if (cloudletManifest && cloudletManifest.response && cloudletManifest.response.data) {
                            this.updateState({ cloudletManifest: cloudletManifest.response.data, showCloudletManifest: true, stepsArray: [] })
                        }
                    }
                    else {
                        let isRequestFailed = responseData ? responseData.code !== 200 : false
                        if (responseData || isRequestFailed) {
                            this.canCloseStepper = isRequestFailed
                            this.updateState({ stepsArray: updateStepper(this.state.stepsArray, labels, request.orgData, responseData) })
                        }
                    }
                }
                else {
                    if (responseData) { this.canCloseStepper = responseData.code === 200 }
                    this.updateState({ stepsArray: updateStepper(this.state.stepsArray, labels, request.orgData, responseData) })
                }
            }
        }
    }

    onCreate = async (data) => {
        if (data) {
            let forms = this.state.forms
            let envVars = undefined
            let resourceQuotas = []
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i];
                if (form.field === localFields.gpuConfig) {
                    for (const option of form.options) {
                        if (option[localFields.gpuConfig] === data[localFields.gpuConfig] && data[localFields.operatorName] === option[localFields.organizationName] || option[localFields.organizationName] === perpetual.MOBILEDGEX) {
                            data[localFields.gpuDriverName] = option[localFields.gpuDriverName]
                            data[localFields.gpuORG] = option[localFields.organizationName]
                            break;
                        }
                    }
                }
                else if (form.uuid) {
                    let uuid = form.uuid;
                    let multiFormData = data[uuid]
                    if (multiFormData) {
                        if (form.field === localFields.cloudletLocation) {
                            multiFormData.latitude = Number(multiFormData.latitude)
                            multiFormData.longitude = Number(multiFormData.longitude)
                            data[localFields.cloudletLocation] = multiFormData
                        }
                        else if (multiFormData[localFields.key] && multiFormData[localFields.value]) {
                            envVars = envVars ? envVars : {}
                            envVars[multiFormData[localFields.key]] = multiFormData[localFields.value]
                        }
                        else if (multiFormData[localFields.resourceName] && multiFormData[localFields.alertThreshold] && multiFormData[localFields.resourceValue]) {
                            resourceQuotas.push({ name: multiFormData[localFields.resourceName], value: parseInt(multiFormData[localFields.resourceValue]), alert_threshold: parseInt(multiFormData[localFields.alertThreshold]) })
                        }
                    }
                    data[uuid] = undefined
                }
            }
            if (envVars) {
                data[localFields.envVars] = envVars
            }

            if (resourceQuotas.length > 0) {
                data[localFields.resourceQuotas] = resourceQuotas
            }

            if (this.props.isUpdate) {
                let updateData = updateFieldData(this, forms, data, this.props.data)
                if (updateData[localFields.gpuConfig]) {
                    updateData[localFields.gpuDriverName] = data[localFields.gpuDriverName]
                    updateData[localFields.gpuORG] = data[localFields.gpuORG]
                }
                if ((updateData[localFields.kafkaUser] || updateData[localFields.kafkaPassword]) && !updateData[localFields.kafkaCluster]) {
                    updateData[localFields.kafkaCluster] = data[localFields.kafkaCluster]
                    updateData.localFields.push('42')
                }
                if (updateData.fields.length > 0) {
                    this.props.handleLoadingSpinner(true)
                    updateCloudlet(this, updateData, this.onCreateResponse)
                }
            }
            else {
                this.props.handleLoadingSpinner(true)
                createCloudlet(this, data, this.onCreateResponse)
            }
        }
    }

    onMapClick = (location) => {
        let forms = this.state.forms
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === localFields.cloudletLocation && !form.rules.disabled) {
                let cloudlet = {}
                cloudlet.cloudletLocation = { latitude: location.lat, longitude: location.long }
                this.updateState({ mapData: [cloudlet] })
                let childForms = form.forms;
                for (let j = 0; j < childForms.length; j++) {
                    let childForm = childForms[j]
                    if (childForm.field === localFields.latitude) {
                        childForm.value = location.lat
                    }
                    else if (childForm.field === localFields.longitude) {
                        childForm.value = location.long
                    }
                }
                break;
            }
        }
        this.reloadForms()
    }

    /**
     * Tab block
     */

    saveFlowInstance = (flowInstance) => {
        this.updateState({ flowInstance })
    }

    getGraph = () =>
    (
        <div className='panel_worldmap' style={{ width: '100%', height: '100%' }}>
            <Suspense fallback={<div></div>}>
                <MexFlow flowDataList={this.state.flowDataList} saveFlowInstance={this.saveFlowInstance} flowInstance={this.state.flowInstance} flowObject={cloudletFLow} />
            </Suspense>
        </div>
    )

    getMap = () => (
        <div className='panel_worldmap' style={{ width: '100%', height: '100%' }}>
            <ListMexMap dataList={this.state.mapData} id={perpetual.PAGE_CLOUDLETS} onMapClick={this.onMapClick} region={this.state.region} register={true} />
        </div>
    )

    getPanes = () => ([
        { label: 'Cloudlet Location', tab: this.getMap(), onClick: () => { this.updateState({ activeIndex: 0 }) } },
        { label: 'Graph', tab: this.getGraph(), onClick: () => { this.updateState({ activeIndex: 1 }) } }
    ])
    /**
     * Tab block
     */

    /*Required*/
    reloadForms = () => {
        this.updateState({
            forms: this.state.forms
        })
    }

    stepperClose = () => {
        if (this.restricted) {
            if (this.canCloseStepper) {
                this.updateState({
                    stepsArray: []
                })
            }
        }
        else {
            this.updateState({
                stepsArray: []
            })
            if (this.canCloseStepper) {
                this.props.onClose(true)
            }
        }
    }

    cloudletManifestForm = () => {
        let fileName = `${this.cloudletData[localFields.cloudletName]}-${this.cloudletData[localFields.operatorName]}-pf`
        let cloudletManifest = this.state.cloudletManifest;
        if (cloudletManifest && cloudletManifest['manifest']) {
            return (
                <CloudletManifest cloudletManifest={cloudletManifest} fileName={fileName} onClose={this.props.onClose} />
            )
        }
    }

    render() {
        const { forms, showCloudletManifest, cloudletManifest, stepsArray, activeIndex } = this.state
        return (
            <div>
                {showCloudletManifest ?
                    cloudletManifest ? this.cloudletManifestForm() : null :
                    <Grid container>
                        <Grid item xs={7}>
                            <div className="round_panel">
                                <MexForms forms={forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} isUpdate={this.isUpdate} />
                            </div>
                        </Grid>
                        <Grid item xs={5} style={{ backgroundColor: '#2A2C34', padding: 5 }}>
                            <MexTab form={{ panes: this.getPanes() }} activeIndex={activeIndex} />
                        </Grid>
                    </Grid>
                }
                <MexMultiStepper multiStepsArray={stepsArray} onClose={this.stepperClose} />
            </div>
        )
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
                if (form.formType === SELECT || form.formType === MULTI_SELECT) {
                    switch (form.field) {
                        case localFields.operatorName:
                            form.options = this.operatorList
                            break;
                        case localFields.singleK8sClusterOwner:
                            form.options = this.developerOrgList
                            break;
                        case localFields.region:
                            form.options = this.props.regions;
                            break;
                        case localFields.ipSupport:
                            form.options = [perpetual.IP_SUPPORT_DYNAMIC];
                            break;
                        case localFields.platformType:
                            form.options = [perpetual.PLATFORM_TYPE_OPEN_STACK, perpetual.PLATFORM_TYPE_VMPOOL, perpetual.PLATFORM_TYPE_VSPHERE, perpetual.PLATFORM_TYPE_VCD, perpetual.PLATFORM_TYPE_K8S_BARE_METAL];
                            break;
                        case localFields.maintenanceState:
                            form.options = [perpetual.MAINTENANCE_STATE_NORMAL_OPERATION, perpetual.MAINTENANCE_STATE_MAINTENANCE_START, perpetual.MAINTENANCE_STATE_MAINTENANCE_START_NO_FAILOVER];
                            break;
                        case localFields.infraApiAccess:
                            form.options = this.infraApiAccessList
                            break;
                        case localFields.trustPolicyName:
                            form.options = this.trustPolicyList
                            break;
                        case localFields.gpuConfig:
                            form.options = this.gpuDriverList
                            break;
                        case localFields.resourceName:
                            form.options = this.resourceQuotaList
                            break;
                        case localFields.key:
                            form.options = this.cloudletPropsList
                            break;
                        case localFields.deployment:
                            form.options = [perpetual.DEPLOYMENT_TYPE_DOCKER, perpetual.DEPLOYMENT_TYPE_KUBERNETES]
                            break;
                        default:
                            form.options = undefined;
                    }
                }
            }
        }
    }


    loadDefaultData = async (forms, data) => {
        if (data) {
            let requestList = []
            let operator = {}
            operator[localFields.operatorName] = data[localFields.operatorName];
            this.operatorList = [operator]
            this.updateState({ mapData: [data] })
            requestList.push(showTrustPolicies(this, { region: data[localFields.region] }))
            requestList.push(showGPUDrivers(this, { region: data[localFields.region] }, true))
            requestList.push(cloudletResourceQuota(this, { region: data[localFields.region], platformType: data[localFields.platformType] }))
            requestList.push(showOrganizations(this, { type: perpetual.OPERATOR }))
            let mcList = await service.multiAuthSyncRequest(this, requestList)

            if (mcList?.length > 0) {
                for (const mc of mcList) {
                    if (mc?.response?.data) {
                        let responseData = mc.response.data
                        let request = mc.request;
                        if (request.method === endpoint.SHOW_ORG) {
                            this.operatorList = _sort(responseData.map(data => (data[localFields.organizationName])))
                        }
                        else if (request.method === endpoint.SHOW_TRUST_POLICY) {
                            this.trustPolicyList = responseData
                        }
                        if (request.method === endpoint.SHOW_GPU_DRIVER) {
                            this.gpuDriverList = responseData
                        }
                        else if (request.method === endpoint.GET_CLOUDLET_RESOURCE_QUOTA_PROPS) {
                            if (responseData.properties) {
                                this.updateResoursceQuotaList(responseData.properties)
                            }
                        }
                    }
                }
            }
            data[localFields.maintenanceState] = undefined

            let indexs = findIndexs(forms, [localFields.envVars, localFields.resourceQuotas])
            let multiFormCount = 0

            for (let form of forms) {
                if (data[localFields.envVars] && form.field === localFields.envVars) {
                    let envVarsArray = data[localFields.envVars]
                    Object.keys(envVarsArray).forEach(item => {
                        let multiForms = this.envForm()
                        let key = item
                        let value = envVarsArray[item]
                        for (let multiForm of multiForms) {
                            if (multiForm.field === localFields.key) {
                                multiForm.value = key
                            }
                            else if (multiForm.field === localFields.value) {
                                multiForm.value = value
                            }
                        }
                        forms.splice(indexs[form.field] + multiFormCount, 0, this.getEnvForm(multiForms))
                        multiFormCount++
                    })
                }
                else if (data[localFields.resourceQuotas] && form.field === localFields.resourceQuotas) {
                    let resourceQuotaArray = data[localFields.resourceQuotas]
                    let descriptions = {}
                    this.resourceQuotaList.forEach(item => {
                        descriptions[item.name] = item.description
                    })
                    resourceQuotaArray.forEach(item => {
                        let multiForms = this.resourceQuotaForm()
                        let description = descriptions[item['name']]

                        for (let multiForm of multiForms) {
                            if (multiForm.field === localFields.resourceName) {
                                multiForm.value = item['name']
                            }
                            else if (multiForm.field === localFields.resourceValue) {
                                multiForm.value = item['value']
                                multiForm.unit = description ? this.readResourceQuotaUnit(description) : undefined
                            }
                            else if (multiForm.formType === TIP) {
                                multiForm.tip = description
                            }
                            else if (multiForm.field === localFields.alertThreshold) {
                                multiForm.value = item['alert_threshold'] ? item['alert_threshold'] : data[localFields.defaultResourceAlertThreshold]
                            }
                        }
                        forms.splice(indexs[form.field] + multiFormCount, 0, this.getResoureQuotaForm(multiForms))
                        multiFormCount++
                    })
                }
            }
        }
    }

    locationForm = () => ([
        { field: localFields.latitude, label: 'Latitude', formType: INPUT, placeholder: '-90 ~ 90', rules: { required: true, type: 'number', onBlur: true }, width: 8, visible: true, update: { edit: true } },
        { field: localFields.longitude, label: 'Longitude', formType: INPUT, placeholder: '-180 ~ 180', rules: { required: true, type: 'number', onBlur: true }, width: 8, visible: true, update: { edit: true } }
    ])

    cloudletManifest = () => {
        return [
            { field: localFields.manifest, serverField: 'manifest', label: 'Manifest', dataType: perpetual.TYPE_YAML },
        ]
    }

    /*Multi Form*/
    envForm = () => ([
        { field: localFields.key, label: 'Key', formType: this.isUpdate ? INPUT : SELECT, placeholder: 'Select Key', rules: { required: true }, width: 7, visible: true, options: this.cloudletPropsList },
        { field: localFields.value, label: 'Value', formType: INPUT, rules: { required: true }, width: 7, visible: true },
        this.isUpdate ? {} :
            { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.removeMultiForm },
        { formType: TIP, visible: true, width: 1 }
    ])

    resourceQuotaForm = () => ([
        { field: localFields.resourceName, label: 'Name', formType: SELECT, placeholder: 'Select Name', rules: { required: true }, width: 5, visible: true, options: this.resourceQuotaList, update: { edit: true } },
        { field: localFields.alertThreshold, label: 'Alert Threshold', formType: INPUT, unit: '%', rules: { required: true }, width: 4, visible: true, update: { edit: true }, value: this.isUpdate ? this.props.data[localFields.defaultResourceAlertThreshold] : undefined },
        { field: localFields.resourceValue, label: 'Value', formType: INPUT, rules: { required: true }, width: 4, visible: true, update: { edit: true } },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1, onClick: this.removeMultiForm },
        { formType: TIP, visible: true, width: 1 }
    ])

    getEnvForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.envVar, formType: MULTI_FORM, forms: form ? form : this.envForm(), width: 3, visible: true })
    }

    getResoureQuotaForm = (form) => {
        return ({ uuid: uniqueId(), field: localFields.resourceQuota, formType: MULTI_FORM, forms: form ? form : this.resourceQuotaForm(), width: 3, visible: true })
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

    formKeys = () => {
        return [
            { label: `${this.isUpdate ? 'Update' : 'Create'} Cloudlet`, formType: MAIN_HEADER, visible: true },
            { field: localFields.region, label: 'Region', formType: SELECT, placeholder: 'Select Region', rules: { required: true }, visible: true, tip: 'Select region where you want to deploy.', update: { key: true } },
            { field: localFields.cloudletName, label: 'Cloudlet Name', formType: INPUT, placeholder: 'Enter cloudlet Name', rules: { required: true }, visible: true, tip: 'Name of the cloudlet.', update: { key: true } },
            { field: localFields.operatorName, label: 'Operator', formType: SELECT, placeholder: 'Select Operator', rules: { required: true, disabled: !redux_org.isAdmin(this) }, visible: true, value: redux_org.nonAdminOrg(this), tip: 'Organization of the cloudlet site', update: { key: true } },
            { uuid: uniqueId(), field: localFields.cloudletLocation, label: 'Cloudlet Location', formType: INPUT, rules: { required: true }, visible: true, forms: this.locationForm(), tip: 'GPS Location', update: { id: ['5', '5.1', '5.2'] } },
            { field: localFields.ipSupport, label: 'IP Support', formType: SELECT, placeholder: 'Select IP Support', rules: { required: true }, visible: true, tip: 'Static IP support indicates a set of static public IPs are available for use, and managed by the Controller. Dynamic indicates the Cloudlet uses a DHCP server to provide public IP addresses, and the controller has no control over which IPs are assigned.' },
            { field: localFields.numDynamicIPs, label: 'Number of Dynamic IPs', formType: INPUT, placeholder: 'Enter Number of Dynamic IPs', rules: { required: true, type: 'number' }, visible: true, update: { id: ['8'] }, tip: 'Number of dynamic IPs available for dynamic IP support.' },
            { field: localFields.physicalName, label: 'Physical Name', formType: INPUT, placeholder: 'Enter Physical Name', visible: true, tip: 'Physical infrastructure cloudlet name.' },
            { field: localFields.platformType, label: 'Platform Type', formType: SELECT, placeholder: 'Select Platform Type', rules: { required: true }, visible: true, tip: 'Supported list of cloudlet types.' },
            { field: localFields.vmPool, label: 'VM Pool', formType: INPUT, placeholder: 'Enter Pool Name', rules: { required: false }, visible: false, tip: 'VM Pool' },
            { field: localFields.openRCData, label: 'OpenRC Data', formType: TEXT_AREA, placeholder: 'Enter OpenRC Data', rules: { required: false }, visible: false, tip: 'key-value pair of access variables delimitted by newline.\nSample Input:\nOS_AUTH_URL=...\nOS_PROJECT_ID=...\nOS_PROJECT_NAME=...', update: { id: ['23', '23.1', '23.2'] } },
            { field: localFields.caCertdata, label: 'CACert Data', formType: TEXT_AREA, placeholder: 'Enter CACert Data', rules: { required: false }, visible: false, tip: 'CAcert data for HTTPS based verfication of auth URL', update: { id: ['23', '23.1', '23.2'] } },
            { field: localFields.infraApiAccess, label: 'Infra API Access', formType: SELECT, placeholder: 'Select Infra API Access', rules: { required: true }, visible: true, tip: 'Infra Access Type is the type of access available to Infra API Endpoint\nDirect:</b> Infra API endpoint is accessible from public network\nRestricted:</b> Infra API endpoint is not accessible from public network' },
            { field: localFields.infraFlavorName, label: 'Infra Flavor Name', formType: 'Input', placeholder: 'Enter Infra Flavor Name', rules: { required: false }, visible: true, tip: 'Infra specific flavor name' },
            { field: localFields.infraExternalNetworkName, label: 'Infra External Network Name', formType: 'Input', placeholder: 'Enter Infra External Network Name', rules: { required: false }, visible: true, tip: 'Infra specific external network name' },
            { field: localFields.allianceOrganization, label: 'Alliance Organization', formType: TEXT_AREA, rules: { rows: 5 }, placeholder: 'Enter Alliance Operator Names\nExample:\nOperator1\nOperator2\nPlease use new line to enter multiple operator names', visible: true, tip: 'Alliance Organization of the cloudlet site', update: { id: ['47'] } },
            { field: localFields.envVars, label: 'Environment Variable', formType: HEADER, forms: this.isUpdate ? [] : [{ formType: ICON_BUTTON, label: 'Add Env Vars', icon: 'add', visible: true, onClick: this.addMultiForm, multiForm: this.getEnvForm }], visible: true, tip: 'Single Key-Value pair of env var to be passed to CRM' },
            { field: localFields.resourceQuotas, label: 'Resource Quota', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Add Resource Quota', icon: 'add', visible: true, onClick: this.addMultiForm, multiForm: this.getResoureQuotaForm }], visible: true, update: { id: ['39', '39.1', '39.2', '39.3'] }, tip: 'Alert Threshold:</b> Generate alert when more than threshold percentage of resource is used\nName:</b> Resource name on which to set quota\nValue:</b> Quota value of the resource' },
            { label: 'Advanced Settings', formType: HEADER, forms: [{ formType: ICON_BUTTON, label: 'Advance Options', icon: 'expand_less', visible: true, onClick: this.advanceMenu }], visible: true },
            { field: localFields.trustPolicyName, label: 'Trust Policy', formType: SELECT, placeholder: 'Select Trust Policy', visible: true, update: { id: ['37'] }, dependentData: [{ index: 1, field: localFields.region }, { index: 3, field: localFields.operatorName }], advance: false, tip: 'Allow you to control the outbound connections your instances are permitted to make' },
            { field: localFields.gpuConfig, label: 'GPU Driver', formType: SELECT, placeholder: 'Select GPU Driver', visible: true, update: { id: ['45', '45.1', '45.1.1', '45.1.2'] }, dependentData: [{ index: 1, field: localFields.region }, { index: 3, field: localFields.operatorName, value: 'MobiledgeX' }], advance: false, tip: 'GPU Configuration associated with cloudlet' },
            { field: localFields.containerVersion, label: 'Container Version', formType: INPUT, placeholder: 'Enter Container Version', rules: { required: false }, visible: true, tip: 'Cloudlet container version', advance: false },
            { field: localFields.vmImageVersion, label: 'VM Image Version', formType: INPUT, placeholder: 'Enter VM Image Version', rules: { required: false }, visible: true, tip: 'MobiledgeX baseimage version where CRM services reside', advance: false },
            { field: localFields.maintenanceState, label: 'Maintenance State', formType: SELECT, placeholder: 'Select Maintenance State', rules: { required: false }, visible: this.isUpdate, update: { id: ['30'] }, tip: 'Maintenance allows for planned downtimes of Cloudlets. These states involve message exchanges between the Controller, the AutoProv service, and the CRM. Certain states are only set by certain actors', advance: false },
            { field: localFields.singleK8sClusterOwner, label: 'Single K8s Cluster Owner', formType: this.isUpdate ? INPUT : SELECT, placeholder: 'Select Single K8s Cluster Owner', visible: true, tip: 'single K8s cluster cloudlet platforms, cluster is owned by this organization instead of multi-tenant.', advance: false },
            { field: localFields.deployment, label: 'Deployment Type', formType: SELECT, placeholder: 'Select Deployment Type', visible: true, tip: 'Deployment type (Kubernetes, Docker, or VM)', advance: false },
            { field: localFields.platformHighAvailability, label: 'Platform High Availability', formType: SWITCH, visible: false, update: { id: ['50'] }, tip: 'Enable platform H/A', advance: false },
            { field: localFields.kafkaCluster, label: 'Kafka Cluster', formType: INPUT, placeholder: 'Enter Kafka Cluster Endpoint', rules: { required: false, onBlur: true }, visible: true, update: { id: ['42'] }, tip: 'Operator provided kafka cluster endpoint to push events to', advance: false },
            { field: localFields.kafkaUser, label: 'Kafka User', formType: INPUT, placeholder: 'Enter Kafka Username', rules: { required: false, onBlur: true }, visible: true, update: { id: ['43'] }, tip: 'Username for kafka SASL/PLAIN authentification, stored securely in secret storage and never visible externally', advance: false },
            { field: localFields.kafkaPassword, label: 'Kafka Password', formType: INPUT, placeholder: 'Enter Kafka Password', rules: { required: false, onBlur: true }, visible: true, update: { id: ['44'] }, tip: 'Password for kafka SASL/PLAIN authentification, stored securely in secret storage and never visible externally', advance: false },
        ]
    }

    updateFormData = (forms, data) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            this.updateUI(form)
            if (data) {
                if (form.field === localFields.envVars && data[localFields.envVars] === undefined) {
                    form.visible = false;
                }
                else if (form.forms && form.formType !== HEADER && form.formType !== MULTI_FORM) {
                    this.updateFormData(form.forms, data) // to fetch the forms inside multiForm data or header
                }
                else if (form.field === localFields.kafkaCluster) {
                    this.kafkaRequired = data[localFields.kafkaCluster] === undefined
                    form.value = data[localFields.kafkaCluster]
                }
                else if (form.field === localFields.allianceOrganization) {
                    let allianceOrgs = data[localFields.allianceOrganization]
                    if (allianceOrgs) {
                        let value = ''
                        let length = allianceOrgs.length - 1
                        allianceOrgs.forEach((org, i) => {
                            value = value + org + (i < length ? '\n' : '')
                        })
                        form.value = value
                    }
                }
                else {
                    form.value = data[form.field]
                    this.checkForms(form, forms, true, data)
                }
            }
        }

    }

    getFormData = async (data) => {
        let forms = this.formKeys()
        if (data) {
            if (this.props.manifestData) {
                this.updateState({ showCloudletManifest: true })
                this.cloudletData = data
                this.updateState({ cloudletManifest: this.props.manifestData })
            }
            else {
                await this.loadDefaultData(forms, data)
            }
        }
        else {
            let organizationList = await showAuthSyncRequest(self, showOrganizations(self, { type: perpetual.OPERATOR }))
            this.operatorList = _sort(organizationList.map(org => (org[localFields.organizationName])))
        }

        forms.push(
            { label: this.isUpdate ? 'Update' : 'Create', formType: 'Button', onClick: this.onCreate, validate: true },
            { label: 'Cancel', formType: 'Button', onClick: this.onAddCancel })

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

    componentDidMount() {
        this._isMounted = true
        this.getFormData(this.props.data)
        this.props.handleViewMode(HELP_CLOUDLET_REG)
    }

    componentWillUnmount() {
        this._isMounted = false
    }
};

const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data,
        regions: state.regionInfo.region
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleViewMode: (data) => { dispatch(actions.viewMode(data)) }
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(CloudletReg));