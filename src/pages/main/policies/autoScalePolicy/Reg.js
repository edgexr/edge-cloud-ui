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
import MexForms, { INPUT, MAIN_HEADER, SELECT, MULTI_SELECT } from '../../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../../actions';
import { localFields } from '../../../../services/fields';
import { redux_org} from '../../../../helper/reduxData'
//model
import { getOrganizationList } from '../../../../services/modules/organization';
import { updateAutoScalePolicy, createAutoScalePolicy } from '../../../../services/modules/autoScalePolicy';
import { HELP_SCALE_POLICY_REG } from "../../../../tutorial";
import { Grid } from '@material-ui/core';
import { service, updateFieldData } from '../../../../services';
import { perpetual } from '../../../../helper/constant';
import cloneDeep from 'lodash/cloneDeep';
import { responseValid } from '../../../../services/config';

class AutoScalePolicyReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forms: []
        }
        this._isMounted = false
        this.isUpdate = this.props.action === 'Update'
        this.regions = cloneDeep(this.props.regions)
        if (!this.isUpdate) { this.regions.splice(0, 0, 'All') }
        this.organizationList = []
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    validateNodes = (currentForm) => {
        if (currentForm.value && currentForm.value.length > 0) {
            let value = parseInt(currentForm.value)
            if (value <= 0) {
                currentForm.error = 'Node must be greater than 0'
                return false;
            }
            else if (currentForm.field === localFields.maximumNodes) {
                let forms = this.state.forms
                for (let i = 0; i < forms.length; i++) {
                    let form = forms[i]
                    if (form.field === localFields.minimumNodes) {
                        let minNode = parseInt(form.value)
                        if (value <= minNode) {
                            currentForm.error = 'Maximum nodes must be greater than minimum nodes'
                            return false;
                        }
                        break;
                    }
                }
            }
        }
        currentForm.error = undefined;
        return true;
    }

    validateThreshold = (currentForm) => {
        if (currentForm.value && currentForm.value.length > 0) {
            let value = parseInt(currentForm.value)
            if (value <= 0 || value > 100) {
                currentForm.error = `${currentForm.label} valid range should be between 1 and 100`
                return false;
            }
        }
        currentForm.error = undefined;
        return true
    }


    checkForms = (form, forms, isInit) => {

    }

    onValueChange = (form) => {
        let forms = this.state.forms;
        this.checkForms(form, forms)
    }


    getForms = () => ([
        { label: `${this.isUpdate ? 'Update' : 'Create'} Auto Scale Policy`, formType: MAIN_HEADER, visible: true },
        { field: localFields.region, label: 'Region', formType: MULTI_SELECT, placeholder: 'Select Region', rules: { required: true }, visible: true, serverField: 'region', tip: 'Select region where you want to create policy', update: { key: true } },
        { field: localFields.organizationName, label: 'Organization', formType: SELECT, placeholder: 'Select Developer', rules: { required: redux_org.isAdmin(this), disabled: !redux_org.isAdmin(this) }, value: redux_org.nonAdminOrg(this), visible: true, tip: 'Name of the Organization that this policy belongs to', update: { key: true } },
        { field: localFields.autoScalePolicyName, label: 'Auto Scale Policy Name', formType: INPUT, placeholder: 'Enter Auto Scale Policy Name', rules: { required: true }, visible: true, tip: 'Policy name', update: { key: true } },
        { field: localFields.minimumNodes, label: 'Minimum Nodes', formType: INPUT, placeholder: 'Enter Minimum Nodes', rules: { type: 'number', required: true, onBlur: true }, visible: true, update: { id: ['3'] }, dataValidateFunc: this.validateNodes, tip: 'Minimum number of cluster nodes' },
        { field: localFields.maximumNodes, label: 'Maximum Nodes', formType: INPUT, placeholder: 'Enter Maximum Nodes', rules: { type: 'number', required: true, onBlur: true }, visible: true, update: { id: ['4'] }, dataValidateFunc: this.validateNodes, tip: 'Maximum number of cluster nodes' },
        { field: localFields.stabilizationWindowSec, label: 'Stabilization Window (sec)', formType: INPUT, placeholder: 'Enter Stabilization Window In Seconds', unit: 'sec', visible: true, rules: { type: 'number', required: true }, update: { id: ['8'] }, tip: 'Stabilization window is the time for which past triggers are considered; the largest scale factor is always taken.' },
        { field: localFields.targetCPU, label: 'Target CPU', formType: INPUT, placeholder: 'Enter Target CPU', rules: { type: 'number' }, unit: '%', visible: true, dataValidateFunc: this.validateThreshold, update: { id: ['9'] }, tip: 'Target per-node cpu utilization (percentage between 1 to 100)' },
        { field: localFields.targetMEM, label: 'Target Memory', formType: INPUT, placeholder: 'Enter Target Memory', rules: { type: 'number' }, unit: '%', visible: true, dataValidateFunc: this.validateThreshold, update: { id: ['10'] }, tip: 'Target per-node memory utilization (percentage between 1 to 100)' },
        { field: localFields.targetActiveConnections, label: 'Target Active Connections', formType: INPUT, placeholder: 'Enter Target Active Connections', visible: true, rules: { type: 'number' }, update: { id: ['11'] }, tip: 'Target per-node number of active connections' },
    ])


    onCreate = async (data) => {
        if (data) {
            let mc = undefined
            if (this.isUpdate) {
                let updateData = updateFieldData(this, this.state.forms, data, this.props.data)
                if (updateData.fields.length > 0) {
                    mc = await updateAutoScalePolicy(this, updateData)
                    if (responseValid(mc)) {
                        let autoscalepolicy = mc.request.data.autoscalepolicy.key.name;
                        this.props.handleAlertInfo('success', `Auto Scale Policy ${autoscalepolicy} updated successfully`)
                        this.props.onClose(true)
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
                    requestList.push(createAutoScalePolicy(requestData))
                })

                if (requestList && requestList.length > 0) {
                    service.multiAuthRequest(this, requestList, this.onAddResponse)
                }
            }
        }
    }
    onAddResponse = (mcList) => {
        if (mcList && mcList.length > 0) {
            mcList.forEach(mc => {
                if (mc.response) {
                    let policyName = mc.request.data.autoscalepolicy.key.name;
                    this.props.handleAlertInfo('success', `Auto Scale Policy ${policyName} created successfully`)
                    this.props.onClose(true)
                }
            })
        }
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
                        <MexForms forms={this.state.forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} />
                    </Grid>
                </Grid>
            </div>
        )
    }

    onAddCancel = () => {
        this.props.onClose(false)
    }



    disableFields = (form) => {
        let rules = form.rules ? form.rules : {}
        let field = form.field
        if (field === localFields.organizationName || field === localFields.region || field === localFields.autoScalePolicyName) {
            rules.disabled = true;
        }
    }

    loadData(forms, data) {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i];
            if (form.field) {
                if (form.formType === SELECT || form.formType === MULTI_SELECT) {
                    switch (form.field) {
                        case localFields.organizationName:
                            form.options = this.organizationList
                            break;
                        case localFields.region:
                            form.options = this.regions
                            break;
                        default:
                            form.options = undefined;
                    }
                }
                if (data) {
                    form.value = data[form.field]
                    this.disableFields(form)
                }
            }
            else if (form.label) {
                if (data) {
                    if (form.label === 'Outbound Security Rules') {
                        form.visible = data[localFields.outboundSecurityRules] && data[localFields.outboundSecurityRules].length > 0 ? true : false
                    }
                }
            }
        }

    }

    getFormData = async (data) => {
        let forms = this.getForms();
        forms.push(
            { label: `${this.isUpdate ? 'Update' : 'Create'} Policy`, formType: 'Button', onClick: this.onCreate, validate: true },
            { label: 'Cancel', formType: 'Button', onClick: this.onAddCancel })
        if (data) {
            let organization = {}
            organization[localFields.organizationName] = data[localFields.organizationName]
            this.organizationList = [organization]

            this.loadData(forms, data)
        }
        else {
            this.organizationList = await getOrganizationList(this, { type: perpetual.DEVELOPER })
            this.loadData(forms)
        }

        this.updateState({ forms })

    }

    componentDidMount() {
        this._isMounted = true
        this.getFormData(this.props.data)
        this.props.handleViewMode(HELP_SCALE_POLICY_REG)
    }

    componentWillUnmount(){
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

export default withRouter(connect(mapStateToProps, mapDispatchProps)(AutoScalePolicyReg));