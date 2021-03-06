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
//Mex
import MexForms, { SELECT, MULTI_SELECT, BUTTON, INPUT, MAIN_HEADER, DATE_PICKER } from '../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { localFields } from '../../../services/fields';
//model
import { createReporter, updateReporter } from '../../../services/modules/reporter';
import { Grid } from '@material-ui/core';

import { getOrganizationList } from '../../../services/modules/organization';
import { timezones, time, FORMAT_FULL_T_Z } from '../../../utils/date_util';
import { timezonePref } from '../../../utils/sharedPreferences_util';
import moment from 'moment';
import { redux_org } from '../../../helper/reduxData';
import { perpetual } from '../../../helper/constant';

class ReporterReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 0,
            forms: [],
        }
        this._isMounted = false
        this.isUpdate = props.id ? props.id === perpetual.ACTION_UPDATE : false
        this.scheduleList = [perpetual.REPORTER_SCHEDULE_WEEKLY, perpetual.REPORTER_SCHEDULE_15_DAYS, perpetual.REPORTER_SCHEDULE_MONTHLY]
        this.timezoneList = timezones()
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    formKeys = () => {
        return [
            { label: `${this.isUpdate ? 'Update' : 'Create'} Report Scheduler`, formType: MAIN_HEADER, visible: true },
            { field: localFields.name, label: 'Name', formType: INPUT, placeholder: 'Enter Report Name', rules: { required: true }, visible: true, tip: 'Reporter name. Can only contain letters, digits, period, hyphen. It cannot have leading or trailing spaces or period. It cannot start with hyphen' },
            { field: localFields.organizationName, label: 'Organization', formType: SELECT, placeholder: 'Select Organization', rules: { required: redux_org.isAdmin(this) ? false : true, disabled: !redux_org.isAdmin(this) ? true : false }, value: redux_org.nonAdminOrg(this), visible: true, tip: ' Organization name' },
            { field: localFields.email, label: 'Email', formType: INPUT, placeholder: 'Enter Email Address', rules: { required: true, type: 'search' }, visible: true, update: { edit: true }, tip: 'Email to send generated reports' },
            { field: localFields.schedule, label: 'Report Interval', formType: SELECT, placeholder: 'Select Interval', rules: { required: true }, visible: true, update: { edit: true }, tip: ' Indicates how often a report should be generated, one of EveryWeek, Every15Days, Every30Days, EveryMonth' },
            { field: localFields.startdate, label: 'Start Schedule Date', formType: DATE_PICKER, placeholder: 'Enter Start Date', rules: { required: true }, visible: true, tip: 'Start date (in RFC3339 format with intended timezone) when the report is scheduled to be generated (Default: today)' },
            { field: localFields.timezone, label: 'Timezone', formType: SELECT, placeholder: 'Select Timezone', rules: { required: true }, visible: true, update: { edit: true }, tip: 'Timezone in which report has to be generated' },
        ]
    }

    checkForms = (form, forms, isInit) => {
    }

    /**Required */
    /*Trigged when form value changes */
    onValueChange = (form) => {
        let forms = this.state.forms;
        this.checkForms(form, forms)
    }

    onCreate = async (data) => {
        if (data) {
            data[localFields.startdate] = time(FORMAT_FULL_T_Z, data[localFields.startdate], data[localFields.timezone])
            let mc = this.isUpdate ? await updateReporter(this, data) : await createReporter(this, data)
            if (mc && mc.response && mc.response.status === 200) {
                this.props.handleAlertInfo('success', `Report Scheduler ${data[localFields.name]} ${this.isUpdate ? 'updated' : 'created'} successfully`)
                this.props.onClose(true)
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
                if (form.formType === SELECT) {
                    switch (form.field) {
                        case localFields.organizationName:
                            form.options = this.organizationList;
                            break;
                        case localFields.schedule:
                            form.options = this.scheduleList;
                            break;
                        case localFields.timezone:
                            form.options = this.timezoneList;
                            form.value = timezonePref()
                            break;
                        default:
                            form.options = undefined;
                    }
                }
            }
        }
    }

    loadDefaultData = async (data) => {
        if (data) {
            let organization = { organizationName: data[localFields.organizationName] }
            this.organizationList = [organization]
        }
    }

    getFormData = async (data) => {
        if (data) {
            await this.loadDefaultData(data)
        }
        else {
            this.organizationList = await getOrganizationList(this, { type: perpetual.OPERATOR })
        }

        let forms = this.formKeys()
        forms.push(
            { label: this.isUpdate ? 'Update' : 'Create', formType: BUTTON, onClick: this.onCreate, validate: true },
            { label: 'Cancel', formType: BUTTON, onClick: this.onAddCancel })

        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            this.updateUI(form)
            if (form.field === localFields.email) {
                form.value = this.props.userInfo.Email
            }
            if (data) {
                form.value = data[form.field] ? data[form.field] : form.value
                this.checkForms(form, forms, true)
            }
        }
        this.updateState({ forms })
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

    componentDidMount() {
        this._isMounted = true
        this.getFormData(this.props.data);
    }

    componentWillUnmount() {
        this._isMounted = false
    }
};


const mapStateToProps = (state) => {
    return {
        userInfo: state.userInfo.data,
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

export default withRouter(connect(mapStateToProps, mapDispatchProps)(ReporterReg));