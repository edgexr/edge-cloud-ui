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
import MexForms, { SELECT, MULTI_SELECT, BUTTON, INPUT, SWITCH, MAIN_HEADER } from '../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { localFields } from '../../../services/fields';
//model
import { createFlavor } from '../../../services/modules/flavor';
import { HELP_FLAVOR_REG } from "../../../tutorial";
import { Grid } from '@material-ui/core';

class FlavorReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 0,
            forms: [],
        }
        this._isMounted = false
        this.isUpdate = this.props.isUpdate
        this.regions = props.regions
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    formKeys = () => {
        return [
            { label: 'Create Flavor', formType: MAIN_HEADER, visible: true },
            { field: localFields.region, label: 'Region', formType: SELECT, placeholder: 'Select Region', rules: { required: true }, visible: true, tip: 'Allows developer to upload app info to different controllers' },
            { field: localFields.flavorName, label: 'Flavor Name', formType: INPUT, placeholder: 'Enter Flavor Name', rules: { required: true }, visible: true, tip: 'Flavor name' },
            { field: localFields.ram, label: 'RAM Size', formType: INPUT, placeholder: 'Enter RAM Size (MB)', unit: 'MB', rules: { required: true, type: 'number' }, visible: true, tip: 'RAM in megabytes' },
            { field: localFields.vCPUs, label: 'Number of vCPUs', formType: INPUT, placeholder: 'Enter Number of vCPUs', rules: { required: true, type: 'number' }, visible: true, tip: 'Number of virtual CPUs' },
            { field: localFields.disk, label: 'Disk Space', formType: INPUT, placeholder: 'Enter Disk Space (GB)', unit: 'GB', rules: { required: true, type: 'number' }, visible: true, tip: 'Amount of disk space in gigabytes' },
            { field: localFields.gpu, label: 'GPU', formType: SWITCH, visible: true, value: false, update: true, tip: 'Optional Resources request, key = [gpu, nas, nic] gpu kinds: [gpu, vgpu, pci] form: $resource=$kind:[$alias]$count ex: optresmap=gpu=vgpus:nvidia-63:1' },
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
            if (this.props.isUpdate) {
                //update flavor data
            }
            else {
                let mcRequest = await createFlavor(this, data)
                if (mcRequest && mcRequest.response && mcRequest.response.status === 200) {
                    this.props.handleAlertInfo('success', `Flavor ${data[localFields.flavorName]} created successfully`)
                    this.props.onClose(true)
                }
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
                if (form.formType === SELECT || form.formType === MULTI_SELECT) {
                    switch (form.field) {
                        case localFields.region:
                            form.options = this.regions;
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

        }
    }

    getFormData = async (data) => {
        if (data) {
            await this.loadDefaultData(data)
        }

        let forms = this.formKeys()
        forms.push(
            { label: this.isUpdate ? 'Update' : 'Create', formType: BUTTON, onClick: this.onCreate, validate: true },
            { label: 'Cancel', formType: BUTTON, onClick: this.onAddCancel })

        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            this.updateUI(form)
            if (data) {
                form.value = data[form.field]
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
        this.props.handleViewMode(HELP_FLAVOR_REG)
    }

    componentWillUnmount(){
        this._isMounted = false
    }
};

const mapStateToProps = (state) => {
    return {
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

export default withRouter(connect(mapStateToProps, mapDispatchProps)(FlavorReg));