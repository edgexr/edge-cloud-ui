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
import MexForms, { MAIN_HEADER, HEADER, SWITCH, INPUT, SELECT, MULTI_FORM, MULTI_SELECT, ICON_BUTTON } from '../../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../../actions';
import { localFields } from '../../../../services/fields';
import { redux_org } from '../../../../helper/reduxData'
//model
import { getOrganizationList } from '../../../../services/modules/organization';
import { updateTrustPolicy, createTrustPolicy } from '../../../../services/modules/trustPolicy';
import { HELP_TRUST_POLICY_REG } from "../../../../tutorial";
import MexMultiStepper, { updateStepper } from '../../../../hoc/stepper/MexMessageMultiStream'
import { Grid } from '@material-ui/core';
import { service, updateFieldDataNew } from '../../../../services';
import { perpetual } from '../../../../helper/constant';
import cloneDeep from 'lodash/cloneDeep';
import { uniqueId, validateRemoteCIDR } from '../../../../helper/constant/shared';
import { responseValid } from '../../../../services/config';

class TrustPolicyReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            forms: [],
            stepsArray: [],
        }
        this._isMounted = false
        this.regions = cloneDeep(this.props.regions)
        this.isUpdate = this.props.action === 'Update'
        if (!this.isUpdate) { this.regions.splice(0, 0, 'All') }
        this.organizationList = []
        this.cloudletList = []
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    validateRemoteCIDR = (form) => {
        if (form.value && form.value.length > 0) {
            if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/([0-9]|1[0-9]|2[0-9]|3[0-2]?)$/.test(form.value)) {
                form.error = 'Remote CIDR format is invalid (must be between 0.0.0.0/0 to 255.255.255.255/32)'
                return false;
            }
        }
        form.error = undefined;
        return true;

    }

    validatePortRange = (form) => {
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

    protocolValueChange(currentForm) {
        let parentForm = currentForm.parent.form
        let forms = this.state.forms
        const isICMP = currentForm.value === perpetual.PROTOCOL_ICMP
        for (const form of forms) {
            if (form.uuid === parentForm.uuid) {
                for (const outBoundRulesForm of form.forms) {
                    if (outBoundRulesForm.icon === '~' || outBoundRulesForm.field === localFields.portRangeMin || outBoundRulesForm.field === localFields.portRangeMax) {
                        outBoundRulesForm.visible = !isICMP;
                    }
                }
                break;
            }
        }
        this.updateState({ forms })
    }

    onValueChange = (currentForm) => {
        if (currentForm.field === localFields.fullIsolation) {
            let forms = this.state.forms;
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i];
                if (form.field === localFields.outboundSecurityRules || form.field === localFields.outboundSecurityRuleMulti) {
                    form.visible = !currentForm.value;
                }
            }
            this.updateState({ forms })
        }

        if (currentForm.field === localFields.protocol) {
            this.protocolValueChange(currentForm)
        }
    }

    getOutboundRulesCount = () => {
        let count = 0;
        let forms = this.state.forms;
        for (let i = 0; i < forms.length; i++) {
            if (forms[i].field === localFields.outboundSecurityRuleMulti) {
                count++;
            }
        }
        return count;
    }

    removeRulesForm = (e, form) => {
        if (this.getOutboundRulesCount() > 1) {
            if (form.parent) {
                let updateForms = Object.assign([], this.state.forms)
                updateForms.splice(form.parent.id, 1);
                this.updateState({ forms: updateForms })
            }
        }
        else {
            this.props.handleAlertInfo('error', 'Enable Full Isolation to disable all rules')
        }
    }

    getOutBoundRules = (protocol, portRangeMin, portRangeMax, remoteCIDR) => ([
        { field: localFields.protocol, label: 'Protocol', formType: SELECT, rules: { required: true, type: 'number', allCaps: true }, width: 3, visible: true, options: [perpetual.PROTOCOL_TCP, perpetual.PROTOCOL_UDP, perpetual.PROTOCOL_ICMP], serverField: 'protocol', update: { edit: true }, value: protocol },
        { field: localFields.remoteCIDR, label: 'Remote CIDR', formType: INPUT, rules: { required: true }, width: 3, visible: true, serverField: 'remote_cidr', dataValidateFunc: validateRemoteCIDR, update: { edit: true }, value: remoteCIDR },
        { field: localFields.portRangeMin, label: 'Port Range Min', formType: INPUT, rules: { required: true, type: 'number' }, width: 3, visible: true, serverField: 'port_range_min', dataValidateFunc: this.validatePortRange, update: { edit: true }, value: portRangeMin },
        { icon: '~', formType: ICON_BUTTON, visible: true, color: 'white', style: { color: 'white', top: 15 }, width: 1 },
        { field: localFields.portRangeMax, label: 'Port Range Max', formType: INPUT, rules: { required: true, type: 'number' }, width: 3, visible: true, serverField: 'port_range_max', dataValidateFunc: this.validatePortRange, update: { edit: true }, value: portRangeMax },
        { icon: 'delete', formType: ICON_BUTTON, visible: true, style: { color: 'white', top: 15 }, width: 1, onClick: this.removeRulesForm }
    ])

    getOutboundSecurityForm = (outBoundRules) => (
        { uuid: uniqueId(), field: localFields.outboundSecurityRuleMulti, formType: MULTI_FORM, forms: outBoundRules, width: 3, visible: true }
    )

    getForms = () => ([
        { label: `${this.isUpdate ? 'Update' : 'Create'} Trust Policy`, formType: MAIN_HEADER, visible: true },
        { field: localFields.region, label: 'Region', formType: MULTI_SELECT, placeholder: 'Select Region', rules: { required: true }, visible: true, serverField: 'region', update: { key: true } },
        { field: localFields.organizationName, label: 'Operator', formType: SELECT, placeholder: 'Select Operator', rules: { required: true, disabled: !redux_org.isAdmin(this) ? true : false }, value: redux_org.nonAdminOrg(this), visible: true, update: { key: true } },
        { field: localFields.trustPolicyName, label: 'Trust Policy Name', formType: INPUT, placeholder: 'Enter Trust Policy Name', rules: { required: true }, visible: true, update: { key: true } },
        { field: localFields.fullIsolation, label: 'Full Isolation', formType: SWITCH, visible: true, value: false, update: { edit: true } },
        { field: localFields.outboundSecurityRules, label: 'Outbound Security Rules', formType: HEADER, forms: [{ formType: ICON_BUTTON, icon: 'add', style: { color: "white", display: 'inline' }, onClick: this.addRulesForm }], visible: true, update: { edit:true } },
    ])

    addRulesForm = (e, form) => {
        if (this._isMounted) {
            this.setState(prevState => ({ forms: [...prevState.forms, this.getOutboundSecurityForm(this.getOutBoundRules())] }))
        }
    }

    onUpdateResponse = (mc) => {
        this.props.handleLoadingSpinner(false)
        if (mc) {
            let responseData = undefined;
            let request = mc.request;
            if (mc.response && mc.response.data) {
                responseData = mc.response.data;
            }
            let labels = [{ label: 'Trust Policy', field: localFields.trustPolicyName }]
            this.updateState({ stepsArray: updateStepper(this.state.stepsArray, labels, request.orgData, responseData) })
        }
    }

    onCreate = async (data) => {
        if (data) {
            let forms = this.state.forms
            let outboundSecurityRules = [];
            if (!data[localFields.fullIsolation]) {
                for (const form of forms) {
                    if (form.uuid) {
                        let uuid = form.uuid;
                        let outboundSecurityRule = data[uuid]
                        if (outboundSecurityRule) {
                            let newRule = {
                                [localFields.protocol]: outboundSecurityRule[localFields.protocol],
                                [localFields.remoteCIDR]: outboundSecurityRule[localFields.remoteCIDR]
                            }
                            if (outboundSecurityRule[localFields.protocol] !== perpetual.PROTOCOL_ICMP) {
                                newRule[localFields.portRangeMin] = outboundSecurityRule[localFields.portRangeMin]
                                newRule[localFields.portRangeMax] = outboundSecurityRule[localFields.portRangeMax]
                            }
                            outboundSecurityRules.push(newRule)
                        }

                    }
                }
            }
            if (outboundSecurityRules.length > 0) {
                data[localFields.outboundSecurityRules] = outboundSecurityRules;
            }
            if (this.isUpdate) {
                let updateData = updateFieldDataNew(this, forms, data, this.props.data)
                if (updateData) {
                    this.props.handleLoadingSpinner(true)
                    updateTrustPolicy(this, updateData, this.onUpdateResponse)
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
                    let requestData = { ...data }
                    requestData[localFields.region] = region
                    requestList.push(createTrustPolicy(requestData))
                })
                if (requestList && requestList.length > 0) {
                    service.multiAuthRequest(this, requestList, this.onAddResponse)
                }
            }
        }
    }

    onAddResponse = (mcList) => {
        if (mcList && mcList.length > 0) {
            mcList.map(mc => {
                if (responseValid(mc)) {
                    let policyName = mc.request.data.trustpolicy.key.name;
                    this.props.handleAlertInfo('success', `Trust Policy ${policyName} created successfully`)
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

    stepperClose = () => {
        this.updateState({
            stepsArray: []
        })
        this.props.onClose(true)
    }


    render() {
        return (
            <div className="round_panel">
                <Grid container>
                    <Grid item xs={12}>
                        <MexForms forms={this.state.forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} isUpdate={this.isUpdate} />
                    </Grid>
                </Grid>
                <MexMultiStepper multiStepsArray={this.state.stepsArray} onClose={this.stepperClose} />
            </div>
        )
    }

    onAddCancel = () => {
        this.props.onClose(false)
    }

    disableFields = (form) => {
        let rules = form.rules ? form.rules : {}
        let field = form.field
        if (field === localFields.organizationName || field === localFields.region || field === localFields.trustPolicyName) {
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
                    if (form.field === localFields.fullIsolation) {
                        form.value = !(data[localFields.outboundSecurityRules] && data[localFields.outboundSecurityRules].length > 0)
                    }
                    else if (form.field === localFields.outboundSecurityRules) {
                        form.visible = data[localFields.outboundSecurityRules] && data[localFields.outboundSecurityRules].length > 0
                    }
                    else {
                        if (form.field === localFields.organizationName) {
                            form.value = data[localFields.operatorName]
                        }
                        else {
                            form.value = data[form.field]
                        }
                    }
                    this.disableFields(form)
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
            organization[localFields.organizationName] = data[localFields.operatorName]
            this.organizationList = [organization]
            this.loadData(forms, data)
            if (data[localFields.outboundSecurityRules] && data[localFields.outboundSecurityRules].length > 0) {
                for (let i = 0; i < data[localFields.outboundSecurityRules].length; i++) {
                    let OutboundSecurityRule = data[localFields.outboundSecurityRules][i]
                    let outboundRules = this.getOutBoundRules();
                    let isICMP = false;
                    for (let j = 0; j < outboundRules.length; j++) {
                        let outboundRule = outboundRules[j];
                        outboundRule.value = OutboundSecurityRule[outboundRule.field]
                        if (outboundRule.field === localFields.protocol) {
                            isICMP = outboundRule.value === perpetual.PROTOCOL_ICMP ? true : false;
                        }
                        if ((outboundRule.field === localFields.portRangeMin || outboundRule.field === localFields.portRangeMax || outboundRule.icon === '~') && isICMP) {
                            outboundRule.visible = false;
                        }
                    }
                    forms.push(this.getOutboundSecurityForm(outboundRules))
                }
            }
        }
        else {
            this.organizationList = await getOrganizationList(this, { type: perpetual.OPERATOR })
            this.loadData(forms)
            forms.push(this.getOutboundSecurityForm(this.getOutBoundRules(perpetual.PROTOCOL_UDP, 53, 53, '0.0.0.0/0')))
            forms.push(this.getOutboundSecurityForm(this.getOutBoundRules(perpetual.PROTOCOL_TCP, 443, 443, '0.0.0.0/0')))
            forms.push(this.getOutboundSecurityForm(this.getOutBoundRules(perpetual.PROTOCOL_UDP, 123, 123, '0.0.0.0/0')))
        }
        this.updateState({ forms })
    }

    componentDidMount() {
        this._isMounted = true
        this.getFormData(this.props.data)
        this.props.handleViewMode(HELP_TRUST_POLICY_REG)
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

export default withRouter(connect(mapStateToProps, mapDispatchProps)(TrustPolicyReg));