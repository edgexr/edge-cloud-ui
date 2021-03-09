import React from 'react';
import { withRouter } from 'react-router-dom';
import { Item, Step } from 'semantic-ui-react';
import MexForms, { MAIN_HEADER, SELECT, INPUT, DUALLIST } from '../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import * as serverData from '../../../services/model/serverData';
import { fields, getOrganization, updateFieldData } from '../../../services/model/format';

import { getOrganizationList } from '../../../services/model/organization';
import { showOrganizations } from '../../../services/model/organization';
import { getOrgCloudletList } from '../../../services/model/cloudlet';
import { createCloudletPool, updateCloudletPool } from '../../../services/model/cloudletPool';
import { createLinkPoolOrg, deleteLinkPoolOrg } from '../../../services/model/cloudletLinkOrg';

import * as constant from '../../../constant';
import { HELP_CLOUDLET_POOL_REG_3, HELP_CLOUDLET_POOL_REG_1 } from "../../../tutorial";

const stepData = [
    {
        step: "Step 1",
        description: "Create Pool"
    },
    {
        step: "Step 2",
        description: "Add Organizations"
    }
]

class CloudletPoolReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 0,
            forms: []
        }
        this.isUpdate = this.props.isUpdate
        this.action = props.action
        this.regions = localStorage.regions ? localStorage.regions.split(",") : [];
        this.operatorList = []
        this.organizationList = []
        this.cloudletList = []
    }

    getCloudletList = async (forms, form, region, operator) => {
        if (region && operator) {
            this.cloudletList = await getOrgCloudletList(this, { region: region, org: operator })
            this.cloudletList = this.cloudletList.filter((cloudlet) => {
                return cloudlet[fields.operatorName] === operator
            })
            this.updateUI(form)
            this.setState({ forms: forms })
        }
    }

    regionValueChange = (currentForm, forms, isInit) => {
        let operator = undefined
        let cloudletForm = undefined
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.operatorName) {
                operator = form.value
            }
            else if (form.field === fields.cloudlets) {
                cloudletForm = form
            }
        }
        this.getCloudletList(forms, cloudletForm, currentForm.value, operator)
    }

    operatorValueChange = (currentForm, forms, isInit) => {
        let region = undefined
        let cloudletForm = undefined
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.region) {
                region = form.value
            }
            else if (form.field === fields.cloudlets) {
                cloudletForm = form
            }
        }
        this.getCloudletList(forms, cloudletForm, region, currentForm.value)
    }

    checkForms = (form, forms, isInit, data) => {
        if (form.field === fields.region) {
            this.regionValueChange(form, forms, isInit)
        }
        else if (form.field === fields.operatorName) {
            this.operatorValueChange(form, forms, isInit)
        }
    }

    onValueChange = (currentForm, data) => {
        let forms = this.state.forms
        this.checkForms(currentForm, forms)
    }

    /**
     * Organization Block
     * * */
    organizationAddResponse = (mcRequestList) => {
        let valid = true;
        if (mcRequestList && mcRequestList.length > 0) {

            for (let i = 0; i < mcRequestList.length; i++) {
                let mcRequest = mcRequestList[i];
                if (mcRequest.response.status !== 200) {
                    valid = false;
                }
            }
        }

        if (valid) {
            let msg = this.action === constant.DELETE_ORGANIZATION ? 'unlinked' : 'linked'
            this.props.handleAlertInfo('success', `Organizations ${msg} successfully`)
            this.props.onClose(true)
        }
    }

    onAddOrganizations = async () => {
        let data = this.formattedData()
        let requestDataList = []
        let organizationList = data[fields.organizations]
        if (organizationList && organizationList.length > 0) {
            for (let i = 0; i < organizationList.length; i++) {
                let newData = data
                let organization = JSON.parse(organizationList[i])
                newData[fields.organizationName] = organization[fields.organizationName]
                requestDataList.push(this.action === constant.DELETE_ORGANIZATION ? deleteLinkPoolOrg(newData) : createLinkPoolOrg(newData))
            }
        }
        serverData.sendMultiRequest(this, requestDataList, this.organizationAddResponse)
    }

    getOrganizationData = (dataList, field) => {
        if (dataList && dataList.length > 0)
            return dataList.map(data => {
                return { value: JSON.stringify(data), label: data[field] }
            })
    }

    getCloudletData = (dataList, field) => {
        if (dataList && dataList.length > 0)
            return dataList.map(data => {
                return { value: data[field], label: data[field] }
            })
    }

    selectOrganization = async (data, isNew) => {
        let region = data[fields.region];
        let operator = data[fields.operatorName];
        let selectedDatas = data[fields.organizations]
        if (!this.props.action || this.action === constant.ADD_ORGANIZATION) {
            let mcRequest = await serverData.sendRequest(this, showOrganizations())
            if (mcRequest && mcRequest.response) {
                this.organizationList = mcRequest.response.data
                if (!isNew) {
                    this.organizationList = constant.filterData(selectedDatas, this.organizationList, fields.organizationName);
                }
            }
        }
        else {
            this.organizationList = selectedDatas;
        }
        let isDelete = this.action === constant.DELETE_ORGANIZATION
        if (this.organizationList.length > 0) {
            let label = isDelete ? 'Unlink' : 'Link'
            let step = [
                { label: `${label} Organizations`, formType: MAIN_HEADER, visible: true },
                { field: fields.region, label: 'Region', formType: INPUT, rules: { disabled: true }, visible: true, value: region },
                { field: fields.poolName, label: 'Pool Name', formType: INPUT, rules: { disabled: true }, visible: true, value: data[fields.poolName] },
                { field: fields.operatorName, label: 'Operator', formType: INPUT, rules: { disabled: true }, visible: true, value: operator },
                { field: fields.organizations, label: 'Organizations', formType: 'DualList', rules: { required: true }, visible: true },
                { label: `${label} Organizations`, formType: 'Button', onClick: this.onAddOrganizations },
                { label: 'Cancel', formType: 'Button', onClick: this.onAddCancel }
            ]
            for (let i = 0; i < step.length; i++) {
                this.updateUI(step[i])
            }
            this.setState({
                step: 1,
                forms: step
            })
            this.props.handleViewMode(HELP_CLOUDLET_POOL_REG_3)
        }
        else {
            this.props.handleAlertInfo('error', `No organizations to ${isDelete ? 'unlink' : 'link'}`)
            this.props.onClose(false)
        }
    }

    /**
     * Organization Block
     * * */

    formattedData = () => {
        let data = {};
        let forms = this.state.forms;
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i];
            if (form.field) {
                data[form.field] = form.value;
            }
        }
        return data
    }

    onCreate = async () => {
        let forms = this.state.forms
        let data = this.formattedData()
        let mcRequest = undefined
        if (this.isUpdate) {
            let updateData = updateFieldData(this, forms, data, this.props.data)
            if (updateData.fields.length > 0) {
                mcRequest = await serverData.sendRequest(this, updateCloudletPool(updateData))
            }
        }
        else {
            mcRequest = await serverData.sendRequest(this, createCloudletPool(data))
        }
        if (mcRequest && mcRequest.response && mcRequest.response.status === 200) {
            this.props.handleAlertInfo('success', `Cloudlet Pool ${data[fields.poolName]} ${this.isUpdate ? 'updated' : 'created'} successfully`)

            if (this.isUpdate) {
                this.props.onClose(true)
            }
            else {
                this.selectOrganization(data, true)
            }
        }
    }

    /*Required*/
    reloadForms = () => {
        this.setState({
            forms: this.state.forms
        })
    }

    render() {
        return (
            <div className="round_panel">
                    <Item className='content create-org' style={{ margin: '30px auto 0px auto', maxWidth: 1200 }}>
                        {this.props.action ? null :
                            <Step.Group stackable='tablet' style={{ width: '100%' }}>
                                {
                                    stepData.map((item, i) => (
                                        <Step active={this.state.step === i} key={i} >
                                            <Step.Content>
                                                <Step.Title>{item.step}</Step.Title>
                                                <Step.Description>{item.description}</Step.Description>
                                            </Step.Content>
                                        </Step>
                                    ))
                                }
                            </Step.Group>}
                        <MexForms forms={this.state.forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} isUpdate={this.isUpdate} />
                    </Item>
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

    updateUI = (form, data) => {
        if (form) {
            this.resetFormValue(form)
            if (form.field) {
                if (form.formType === SELECT || form.formType === DUALLIST) {
                    switch (form.field) {
                        case fields.region:
                            form.options = this.regions;
                            break;
                        case fields.operatorName:
                            form.options = this.operatorList
                            break;
                        case fields.cloudlets:
                            form.options = this.getCloudletData(this.cloudletList, fields.cloudletName)
                            break;
                        case fields.organizations:
                            form.options = this.getOrganizationData(this.organizationList, fields.organizationName)
                            break;
                        default:
                            form.options = undefined;
                    }
                }
            }
        }
    }

    loadDefaultData = async (data) => {
        let operator = {}
        operator[fields.operatorName] = data[fields.operatorName];
        this.operatorList = [operator]

        if (this.action === constant.ADD_CLOUDLET) {
            this.cloudletList = await getOrgCloudletList(this, { region: data[fields.region], org: data[fields.operatorName] })
            if (this.cloudletList && this.cloudletList.length > 0) {
                this.cloudletList = this.cloudletList.filter((cloudlet) => {
                    return cloudlet[fields.operatorName] === data[fields.operatorName]
                })
            }
        }
    }

    getFormData = async (data) => {
        if (data) {
            await this.loadDefaultData(data)
        }
        else {
            this.organizationList = await getOrganizationList(this)

            this.operatorList = []
            for (let i = 0; i < this.organizationList.length; i++) {
                let organization = this.organizationList[i]
                if (organization[fields.type] === 'operator' || getOrganization()) {
                    this.operatorList.push(organization[fields.organizationName])
                }
            }
        }

        if (this.action === constant.ADD_ORGANIZATION || this.action === constant.DELETE_ORGANIZATION) {
            this.selectOrganization(data, false)
        }
        else {
            let forms = [
                { label: `${this.isUpdate ? 'Update' : 'Create'} Cloudlet Pool`, formType: MAIN_HEADER, visible: true },
                { field: fields.region, label: 'Region', formType: SELECT, placeholder: 'Select Region', rules: { required: true }, visible: true, update: { key: true } },
                { field: fields.poolName, label: 'Pool Name', formType: INPUT, placeholder: 'Enter Cloudlet Pool Name', rules: { required: true }, visible: true, update: { key: true } },
                { field: fields.operatorName, label: 'Operator', formType: SELECT, placeholder: 'Select Operator', rules: { required: true, disabled: getOrganization() ? true : false }, visible: true, value: getOrganization(), update: { key: true } },
                { field: fields.cloudlets, label: 'Cloudlets', formType: DUALLIST, update: { id: ['3'] }, rules: { required: false }, visible: true },
                { label: `${this.isUpdate ? 'Update' : 'Create'}`, formType: 'Button', onClick: this.onCreate, validate: true },
                { label: 'Cancel', formType: 'Button', onClick: this.onAddCancel }
            ]

            for (let i = 0; i < forms.length; i++) {
                let form = forms[i]
                this.updateUI(form)
                if (data) {
                    form.value = data[form.field]
                }
            }

            this.setState({
                forms: forms
            })
        }
    }

    componentDidMount() {
        this.getFormData(this.props.data)
        this.props.handleViewMode(HELP_CLOUDLET_POOL_REG_1);
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleViewMode: (data) => { dispatch(actions.viewMode(data)) },
    };
};

export default withRouter(connect(null, mapDispatchProps)(CloudletPoolReg));