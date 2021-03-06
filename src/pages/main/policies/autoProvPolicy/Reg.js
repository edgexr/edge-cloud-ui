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

import React from 'react';
import { withRouter } from 'react-router-dom';
import MexForms, { SELECT, DUALLIST, INPUT, BUTTON, HEADER, MULTI_FORM, MAIN_HEADER, ICON_BUTTON } from '../../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../../actions';
import { service, updateFieldData } from '../../../../services';
import { localFields } from '../../../../services/fields';
import { redux_org } from '../../../../helper/reduxData'
import { getOrganizationList } from '../../../../services/modules/organization';
import { fetchCloudletData } from '../../../../services/modules/cloudlet';
import { createAutoProvPolicy, updateAutoProvPolicy, addAutoProvCloudletKey, deleteAutoProvCloudletKey } from '../../../../services/modules/autoProvPolicy';
import { HELP_AUTO_PROV_REG_2, HELP_AUTO_PROV_REG_1 } from "../../../../tutorial";
import { Grid } from '@material-ui/core';
import { perpetual } from '../../../../helper/constant';

class AutoProvPolicyReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forms: []
        }
        this._isMounted = false
        this.isUpdate = this.props.isUpdate
        this.organizationList = []
        this.cloudletList = []
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    getCloudletData = (dataList) => {
        if (dataList && dataList.length > 0)
            return dataList.map(data => {
                let dualFormat = {}
                let cloudletName = data[localFields.cloudletName];
                dualFormat[localFields.cloudletName] = cloudletName
                dualFormat[localFields.operatorName] = data[localFields.operatorName]
                dualFormat[localFields.cloudletLocation] = data[localFields.cloudletLocation]
                dualFormat[localFields.partnerOperator] = data[localFields.partnerOperator]
                return { value: JSON.stringify(dualFormat), label: cloudletName }
            })
    }

    getCloudletInfo = async (form, forms) => {
        if (!this.isUpdate) {
            this.cloudletList = []
            let region = undefined;
            let organization = undefined;
            for (let i = 0; i < form.dependentData.length; i++) {
                let dependentForm = forms[form.dependentData[i].index]
                if (dependentForm.field === localFields.region) {
                    region = dependentForm.value
                }
                else if (dependentForm.field === localFields.organizationName) {
                    organization = dependentForm.value
                }
            }
            if (region && organization) {
                this.cloudletList = await fetchCloudletData(this, { region: region, org: organization, type: perpetual.DEVELOPER })
            }
            this.updateUI(form)
            this.updateState({ forms })
        }
    }

    regionValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === localFields.cloudlets) {
                this.getCloudletInfo(form, forms)
            }
        }
    }

    organizationValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === localFields.cloudlets) {
                this.getCloudletInfo(form, forms)
                break;
            }
        }
    }

    minActiveInstancesValueChange = (currentForm, forms, isInit) => {
        let currentValue = currentForm.value
        if (!isInit) {
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                if (form.field === localFields.deployClientCount) {
                    form.rules.required = !(currentValue && currentValue.length > 0)
                    break;
                }
            }
            this.updateState({ forms })
        }
    }

    deployClientCountValueChange = (currentForm, forms, isInit) => {
        let currentValue = currentForm.value
        if (!isInit) {
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                if (form.field === localFields.minActiveInstances) {
                    form.rules.required = !(currentValue && currentValue.length > 0)
                    break;
                }
            }
            this.updateState({ forms })
        }
    }

    checkForms = (form, forms, isInit, data) => {
        if (form.field === localFields.region) {
            this.regionValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.organizationName) {
            this.organizationValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.deployClientCount) {
            this.deployClientCountValueChange(form, forms, isInit)
        }
        else if (form.field === localFields.minActiveInstances) {
            this.minActiveInstancesValueChange(form, forms, isInit)
        }
    }

    onValueChange = (form) => {
        let forms = this.state.forms;
        this.checkForms(form, forms)
    }

    filterCloudlets = () => {
        let newCloudletList = []
        if (this.props.data) {
            let selectedCloudlets = this.props.data[localFields.cloudlets]
            if (selectedCloudlets && selectedCloudlets.length > 0) {
                for (let i = 0; i < selectedCloudlets.length; i++) {
                    let selectedCloudlet = selectedCloudlets[i];
                    for (let j = 0; j < this.cloudletList.length; j++) {
                        let cloudlet = this.cloudletList[j]
                        if (selectedCloudlet[localFields.cloudletName] === cloudlet[localFields.cloudletName]) {
                            if (this.props.action === perpetual.ADD_CLOUDLET) {
                                this.cloudletList.splice(j, 1)
                            }
                            else if (this.props.action === perpetual.DELETE_CLOUDLET) {
                                newCloudletList.push(cloudlet)
                            }
                            break;
                        }
                    }
                }
            }
        }
        this.cloudletList = newCloudletList.length > 0 ? newCloudletList : this.cloudletList
    }


    selectCloudlet = async (data) => {
        let region = data[localFields.region]
        let organization = data[localFields.organizationName]
        let autoPolicyName = data[localFields.autoPolicyName]
        if (this.cloudletList && this.cloudletList.length > 0) {
            let action = 'Add'
            if (this.props.action === perpetual.DELETE_CLOUDLET) {
                action = 'Delete'
            }
            this.filterCloudlets();
            let forms = [
                { label: `${action} Cloudlets`, formType: HEADER, visible: true },
                { field: localFields.region, label: 'Region', formType: SELECT, placeholder: 'Select Region', rules: { disabled: true }, visible: true, options: [{ key: region, value: region, text: region }], value: region },
                { field: localFields.organizationName, label: 'Organization', formType: SELECT, placeholder: 'Select Organization', rules: { disabled: true }, visible: true, options: [{ key: organization, value: organization, text: organization }], value: organization },
                { field: localFields.autoPolicyName, label: 'Auto Policy Name', formType: INPUT, placeholder: 'Enter Auto Provisioning Policy Name', rules: { disabled: true }, visible: true, value: autoPolicyName },
                { field: localFields.cloudlets, label: 'Cloudlets', formType: DUALLIST, rules: { required: true }, visible: true },
                { label: `${action}`, formType: BUTTON, onClick: this.onAddCloudlets },
                { label: 'Cancel', formType: BUTTON, onClick: this.onAddCancel }
            ]
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                this.updateUI(form)
            }
            this.updateState({ forms })
            this.props.handleViewMode(HELP_AUTO_PROV_REG_2);
        }
        else {
            this.props.handleAlertInfo('error', 'No Cloudlets present')
            this.props.onClose(true)
        }
    }

    addCloudletResponse = (mcRequestList) => {
        let valid = false;
        if (mcRequestList && mcRequestList.length > 0) {

            for (let i = 0; i < mcRequestList.length; i++) {
                let mcRequest = mcRequestList[i];
                if (mcRequest.response.status === 200) {
                    valid = true;
                }
            }
        }

        if (valid) {
            let msg = this.props.action === perpetual.DELETE_CLOUDLET ? 'removed' : 'added'
            this.props.handleAlertInfo('success', `Cloudlets ${msg} successfully`)
            this.props.onClose(true)
        }
    }

    getCloudletList = (data) => {
        let cloudlets = data[localFields.cloudlets]
        let cloudletList = undefined
        if (cloudlets && cloudlets.length > 0) {
            cloudletList = []
            for (let i = 0; i < cloudlets.length; i++) {
                cloudletList.push(JSON.parse(cloudlets[i]))
            }
        }
        return cloudletList
    }

    onCreate = async (data) => {
        if (data[localFields.deployClientCount] || data[localFields.minActiveInstances]) {
            let mcRequest = undefined
            data[localFields.cloudlets] = this.getCloudletList(data)
            if (this.isUpdate) {
                let updateData = updateFieldData(this, this.state.forms, data, this.props.data)
                if (updateData.fields.length > 0) {
                    mcRequest = await service.authSyncRequest(this, updateAutoProvPolicy(updateData))
                }
            }
            else {
                mcRequest = await service.authSyncRequest(this, createAutoProvPolicy(data))
            }
            if (mcRequest && mcRequest.response && mcRequest.response.status === 200) {
                this.props.handleAlertInfo('success', `Auto Provisioning Policy ${data[localFields.autoPolicyName]} ${this.isUpdate ? 'update' : 'created'} successfully`)
                this.props.onClose(true)
            }
        }
        else {
            this.props.handleAlertInfo('error', `Please define either deploy request count or minimum active instances`)
        }
    }

    onAddCloudlets = (data) => {
        let requestList = []
        let cloudletList = data[localFields.cloudlets]
        if (cloudletList && cloudletList.length > 0) {
            for (let i = 0; i < cloudletList.length; i++) {
                let cloudlet = JSON.parse(cloudletList[i])
                data.cloudletName = cloudlet[localFields.cloudletName]
                data.operatorName = cloudlet[localFields.operatorName]
                data.partnerOperator = cloudlet[localFields.partnerOperator]
                if (this.props.action === perpetual.DELETE_CLOUDLET) {
                    requestList.push(deleteAutoProvCloudletKey(data))
                }
                else {
                    requestList.push(addAutoProvCloudletKey(data))
                }
            }
        }
        service.multiAuthRequest(this, requestList, this.addCloudletResponse)
    }

    /*Required*/
    reloadForms = () => {
        this.updateState({
            forms: this.state.forms
        })
    }

    render() {
        return (
            <div className="round_panel">
                <Grid container>
                    <Grid item xs={12}>
                        <MexForms forms={this.state.forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} isUpdate={this.isUpdate} />
                    </Grid>
                </Grid>
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
                if (form.formType === SELECT || form.formType === DUALLIST) {
                    switch (form.field) {
                        case localFields.organizationName:
                            form.options = this.organizationList
                            break;
                        case localFields.region:
                            form.options = this.props.regions;
                            break;
                        case localFields.cloudlets:
                            form.options = this.getCloudletData(this.cloudletList);
                            break;
                        default:
                            form.options = undefined;
                    }
                }
            }
        }
    }

    validatedeployClientCount = (form) => {
        if (form.value && form.value.length > 0) {
            let value = parseInt(form.value)
            if (value <= 0) {
                form.error = 'Deploy Request Count must be greater than zero'
                return false;
            }
        }
        form.error = undefined;
        return true;
    }

    validateMinInst = (currentForm) => {
        let forms = this.state.forms
        if (currentForm.value && currentForm.value.length > 0) {
            let value = parseInt(currentForm.value)
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                if (form.field === localFields.cloudlets) {
                    if (!form.value || (value > form.value.length)) {
                        currentForm.error = 'Minimum active instances cannot be greater the number of Cloudlets'
                        return false
                    }
                    break;
                }
            }
        }
        currentForm.error = undefined;
        return true;
    }

    validateMaxInst = (currentForm) => {
        let forms = this.state.forms
        if (currentForm.value && currentForm.value.length > 0) {
            let value = parseInt(currentForm.value)
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                if (form.field === localFields.minActiveInstances) {
                    if (value < parseInt(form.value)) {
                        currentForm.error = 'Maximum active instances cannot be lesser than minimum instances'
                        return false
                    }
                    break;
                }
            }
        }
        currentForm.error = undefined;
        return true;
    }

    formKeys = () => {
        return [
            { label: `${this.isUpdate ? 'Update' : 'Create'} Auto Provisioning Policy`, formType: MAIN_HEADER, visible: true },
            { field: localFields.region, label: 'Region', formType: 'Select', placeholder: 'Select Region', rules: { required: true }, visible: true, update: { key: true } },
            { field: localFields.organizationName, label: 'Organization', formType: 'Select', placeholder: 'Select Developer', rules: { required: redux_org.isAdmin(this) ? false : true, disabled: !redux_org.isAdmin(this) ? true : false }, value: redux_org.nonAdminOrg(this), visible: true, tip: 'Name of the organization for the cluster that this policy will apply to', update: { key: true } },
            { field: localFields.autoPolicyName, label: 'Auto Policy Name', formType: 'Input', placeholder: 'Enter Auto Provisioning Policy Name', rules: { required: true }, visible: true, tip: 'Policy name', update: { key: true } },
            { field: localFields.deployClientCount, label: 'Deploy Request Count', formType: 'Input', rules: { type: 'number', required: true, onBlur: true, requiredMsg: 'Either Deploy Request Count or Min Active Instances is mandatory' }, visible: true, update: { id: ['3'] }, dataValidateFunc: this.validatedeployClientCount, placeholder: 'Enter Minimum Number of Clients', tip: 'Minimum number of clients within the auto deploy interval to trigger deployment' },
            { field: localFields.undeployClientCount, label: 'Undeploy Request Count', formType: 'Input', rules: { type: 'number', required: false }, visible: true, update: { id: ['8'] }, placeholder: 'Enter Number of Active Clients', tip: 'Number of active clients for the undeploy interval below which trigers undeployment, 0 (default) disables auto undeploy' },
            { field: localFields.deployIntervalCount, label: 'Deploy Interval Count', formType: 'Input', rules: { type: 'number' }, visible: true, update: { id: ['4'] }, placeholder: 'Enter Number of Intervals', tip: 'Number of intervals to check before triggering deployment' },
            { field: localFields.undeployIntervalCount, label: 'Undeploy Interval Count', formType: 'Input', rules: { type: 'number' }, visible: true, update: { id: ['9'] }, placeholder: 'Enter Number of Intervals', tip: 'Number of intervals to check before triggering undeployment' },
            { field: localFields.cloudlets, label: 'Cloudlets', formType: 'DualList', rules: { required: false }, visible: true, update: { id: ['5', '5.1', '5.1.1', '5.1.2'] }, dependentData: [{ index: 1, field: localFields.region }, { index: 2, field: localFields.organizationName }] },
            { field: localFields.minActiveInstances, label: 'Min Active Instances (Required for HA)', formType: 'Input', rules: { type: 'number', required: true, onBlur: true, requiredMsg: 'Either Min Active Instances or Deploy Request Count is mandatory' }, visible: true, update: { id: ['6'] }, dataValidateFunc: this.validateMinInst, placeholder: 'Enter Minimum Active Instances', tip: 'Minimum number of active instances for High-Availability' },
            { field: localFields.maxInstances, label: 'Max Instances', formType: 'Input', rules: { type: 'number', required: false }, visible: true, update: { id: ['7'] }, dataValidateFunc: this.validateMaxInst, placeholder: 'Enter Maximum Active Instances', tip: 'Maximum number of instances (active or not)' },
        ]
    }

    updateFormData = (forms, data) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            this.updateUI(form)
            if (data) {
                if (form.forms && form.formType !== HEADER && form.formType !== MULTI_FORM) {
                    this.updateFormData(form.forms, data)
                }
                else {
                    if (form.formType === DUALLIST) {
                        form.value = data[form.field].map(item => {
                            return JSON.stringify(item)
                        })
                    }
                    else {
                        form.value = data[form.field]
                        if (form.field === localFields.minActiveInstances) {
                            form.rules.required = data[localFields.deployClientCount] === undefined || data[localFields.deployClientCount].length === 0
                        }
                        else if (form.field === localFields.deployClientCount) {
                            form.rules.required = data[localFields.minActiveInstances] === undefined || data[localFields.minActiveInstances].length === 0
                        }
                        this.checkForms(form, forms, true)
                    }
                }
            }
        }

    }

    loadDefaultData = async (data) => {
        if (data) {
            let organization = {}
            organization[localFields.organizationName] = data[localFields.organizationName];
            this.organizationList = [organization]
            this.cloudletList = await fetchCloudletData(this, { region: data[localFields.region], org: data[localFields.organizationName], type: perpetual.DEVELOPER })
        }
    }

    getFormData = async (data) => {
        if (data) {
            await this.loadDefaultData(data)
        }
        else {
            this.organizationList = await getOrganizationList(this, { type: perpetual.DEVELOPER });
        }

        if (this.props.action === perpetual.ADD_CLOUDLET || this.props.action === perpetual.DELETE_CLOUDLET) {
            this.selectCloudlet(data)
        }
        else {
            let forms = this.formKeys()

            forms.push(
                { label: this.isUpdate ? 'Update' : 'Create', formType: 'Button', onClick: this.onCreate, validate: true },
                { label: 'Cancel', formType: 'Button', onClick: this.onAddCancel })

            this.updateFormData(forms, data)

            this.updateState({ forms })
        }
    }

    componentDidMount() {
        this._isMounted = true
        this.getFormData(this.props.data);
        this.props.handleViewMode(HELP_AUTO_PROV_REG_1)
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
        handleViewMode: (data) => { dispatch(actions.viewMode(data)) },
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(AutoProvPolicyReg));