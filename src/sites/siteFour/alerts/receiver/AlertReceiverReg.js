import React from 'react';
import { withRouter } from 'react-router-dom';
//Mex
import MexForms, { SELECT, MULTI_SELECT, BUTTON, INPUT, MAIN_HEADER } from '../../../../hoc/forms/MexForms';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../../actions';
import { fields, getOrganization } from '../../../../services/model/format';
//model
import { createAlertReceiver, sendRequests } from '../../../../services/model/alerts';
import { Grid } from 'semantic-ui-react';
import * as constant from '../../../../constant'
import * as endpoints from '../../../../services/model/endpoints'
import { showOrganizations } from '../../../../services/model/organization';
import { showCloudlets } from '../../../../services/model/cloudlet';
import { showAppInsts } from '../../../../services/model/appInstance';
import { showClusterInsts } from '../../../../services/model/clusterInstance';
import uuid from 'uuid'
import cloneDeep from 'lodash/cloneDeep';
import { LinearProgress } from '@material-ui/core'

const RECEIVER_TYPE = [constant.RECEIVER_TYPE_EMAIL, constant.RECEIVER_TYPE_SLACK]
const RECEIVER_SEVERITY = ["Info", "Warning", "Error"]

const SELECTOR = [
    { selector: 'App', key: 'appname' },
    { selector: 'Cluster', key: 'cluster' },
    { selector: 'Cloudlet', key: 'cloudlet' },
]
class FlavorReg extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            step: 0,
            forms: [],
            loading: true
        }
        this.isUpdate = this.props.isUpdate
        this.regions = constant.regions()
        this.organizationList = []
        this.cloudletList = [];
        this.appInstList = [];
        this.clusterInstList = []
    }

    locationForm = () => ([
        { field: fields.slackchannel, label: 'Slack Channel', formType: INPUT, placeholder: 'Enter Slack Channel to be Receiving the Alert', rules: { required: true }, width: 8, visible: true, update: true, init: true },
        { field: fields.slackwebhook, label: 'Slack URL', formType: INPUT, placeholder: 'Enter Slack Webhook URL', rules: { required: true }, width: 8, visible: true, update: true, init: true }
    ])

    formKeys = () => {
        return [
            { label: 'Create Alert Receiver', formType: MAIN_HEADER, visible: true },
            { field: fields.alertname, label: 'Alert Name', formType: INPUT, placeholder: 'Enter Alert Name', rules: { required: true }, visible: true, tip: 'Unique name of this receiver' },
            { field: fields.type, label: 'Receiver Type', formType: SELECT, placeholder: 'Select Receiver Type', rules: { required: true }, visible: true, tip: 'Receiver type - email, or slack' },
            { uuid: uuid(), field: fields.slack, label: 'Slack', formType: INPUT, rules: { required: true }, visible: false, forms: this.locationForm(), tip: 'Slack channel to be receiving the alert\nSlack webhook url' },
            { field: fields.email, label: 'Email', formType: INPUT, placeholder: 'Enter Email Address', rules: { required: true }, visible: false, tip: 'Email address receiving the alert (by default email associated with the account)' },
            { field: fields.severity, label: 'Severity', formType: SELECT, placeholder: 'Select Severity', rules: { required: true }, visible: true, tip: 'Alert severity level - one of "info", "warning", "error"' },
            { field: fields.selector, label: 'Selector', formType: SELECT, placeholder: 'Select Selector', rules: { required: true, disabled: true }, visible: true, tip: 'Selector for which you want to receive alerts' },
            { field: fields.organizationName, label: 'Developer', formType: SELECT, placeholder: 'Select Developer', rules: { required: false }, visible: false, tip: 'Cluster or App Developer' },
            { field: fields.operatorName, label: 'Operator', formType: SELECT, placeholder: 'Select Operator', rules: { required: false }, visible: false },
            { field: fields.cloudletName, label: 'Cloudlet', formType: SELECT, placeholder: 'Select Cloudlet', rules: { required: false }, visible: false, dependentData: [{ index: 8, field: fields.operatorName }], strictDependency: false },
            { field: fields.clusterName, label: 'Cluster', formType: SELECT, placeholder: 'Select Cluster', rules: { required: false }, visible: false, dependentData: [{ index: 7, field: fields.organizationName }, { index: 8, field: fields.operatorName, strictDependency: false }, { index: 9, field: fields.cloudletName, strictDependency: false }] },
            { field: fields.appName, label: 'App', formType: SELECT, placeholder: 'Select App', rules: { required: false }, visible: false, dependentData: [{ index: 7, field: fields.organizationName }, { index: 8, field: fields.operatorName }, { index: 9, field: fields.cloudletName }, { index: 10, field: fields.clusterName }], strictDependency: false },
            { field: fields.version, label: 'App Version', formType: SELECT, placeholder: 'Select App Version', rules: { required: false }, visible: false, dependentData: [{ index: 9, field: fields.appName }], strictDependency: false }
        ]
    }

    typeChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.email) {
                form.visible = currentForm.value === constant.RECEIVER_TYPE_EMAIL
            }
            else if (form.field === fields.slack) {
                form.visible = currentForm.value === constant.RECEIVER_TYPE_SLACK
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }

    appNameValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.version) {
                form.value = undefined
                this.updateUI(form)
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }

    organizationValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.appName || form.field === fields.version || form.field === fields.clusterName) {
                form.value = undefined
                this.updateUI(form)
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }

    clusterValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.appName || form.field === fields.version) {
                form.value = undefined
                this.updateUI(form)
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }

    cloudletValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.appName || form.field === fields.version || form.field === fields.clusterName) {
                form.value = undefined
                this.updateUI(form)
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }

    operatorValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.appName || form.field === fields.version || form.field === fields.clusterName || form.field === fields.cloudletName) {
                form.value = undefined
                this.updateUI(form)
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }

    selectorValueChange = (currentForm, forms, isInit) => {
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            switch (form.field) {
                case fields.organizationName:
                    let valid = currentForm.value === 'App' || currentForm.value === 'Cluster'
                    form.rules.required = valid
                    form.visible = valid
                    break;
                case fields.appName:
                    form.visible = currentForm.value === 'App'
                    break;
                case fields.version:
                    form.visible = currentForm.value === 'App'
                    break;
                case fields.clusterName:
                    form.visible = currentForm.value === 'App' || currentForm.value === 'Cluster'
                    break;
                case fields.cloudletName:
                    form.visible = currentForm.value === 'Cloudlet' || currentForm.value === 'App' || currentForm.value === 'Cluster'
                    break;
                case fields.operatorName:
                    form.rules.required = currentForm.value === 'Cloudlet'
                    form.visible = currentForm.value === 'Cloudlet' || currentForm.value === 'App' || currentForm.value === 'Cluster'
                    form.value = undefined
                    break;
            }
        }
        if (isInit === undefined || isInit === false) {
            this.setState({ forms: forms })
        }
    }



    checkForms = (form, forms, isInit) => {
        if (form.field === fields.type) {
            this.typeChange(form, forms, isInit)
        }
        else if (form.field === fields.selector) {
            this.selectorValueChange(form, forms, isInit)
        }
        else if (form.field === fields.organizationName) {
            this.organizationValueChange(form, forms, isInit)
        }
        else if (form.field === fields.operatorName) {
            this.operatorValueChange(form, forms, isInit)
        }
        else if (form.field === fields.appName) {
            this.appNameValueChange(form, forms, isInit)
        }
        else if (form.field === fields.cloudletName) {
            this.cloudletValueChange(form, forms, isInit)
        }
        else if (form.field === fields.clusterName) {
            this.clusterValueChange(form, forms, isInit)
        }
    }

    /**Required */
    /*Trigged when form value changes */
    onValueChange = (form) => {
        let forms = this.state.forms;
        this.checkForms(form, forms)
    }

    onCreate = async (data) => {
        if (data) {
            let forms = this.state.forms
            for (let i = 0; i < forms.length; i++) {
                let form = forms[i];
                if (form.uuid) {
                    let uuid = form.uuid;
                    let multiFormData = data[uuid]
                    if (multiFormData) {
                        if (form.field === fields.slack) {
                            data[fields.slackchannel] = multiFormData[fields.slackchannel]
                            data[fields.slackwebhook] = multiFormData[fields.slackwebhook]
                        }
                    }
                    data[uuid] = undefined
                }
            }
            let mcRequest = await createAlertReceiver(this, data)
            if (mcRequest && mcRequest.response && mcRequest.response.status === 200) {
                this.props.handleAlertInfo('success', `Alert Receiver ${data[fields.alertname]} created successfully`)
                this.props.onClose(true)
            }
        }
    }


    /*Required*/
    reloadForms = () => {
        this.setState({
            forms: this.state.forms
        })
    }

    stepperClose = () => {
        this.setState({
            stepsArray: []
        })
        this.props.onClose(true)
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
                        case fields.organizationName:
                            form.options = this.organizationList
                            break;
                        case fields.type:
                            form.options = RECEIVER_TYPE;
                            break;
                        case fields.severity:
                            form.options = RECEIVER_SEVERITY;
                            break;
                        case fields.selector:
                            form.options = SELECTOR;
                            break;
                        case fields.operatorName:
                            form.options = this.cloudletList
                            break;
                        case fields.cloudletName:
                            form.options = this.cloudletList
                            break;
                        case fields.appName:
                            form.options = this.appInstList
                            break;
                        case fields.version:
                            form.options = this.appInstList
                            break;
                        case fields.clusterName:
                            form.options = this.clusterInstList
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
        else {
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

        this.setState({
            forms: forms
        })

    }

    render() {
        const { loading } = this.state
        return (
            <div>
                {loading ? <LinearProgress /> : null}
                <div className="round_panel">
                    <Grid style={{ display: 'flex' }}>
                        <Grid.Row>
                            <Grid.Column width={16}>
                                <MexForms forms={this.state.forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} isUpdate={this.isUpdate} />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </div></div>
        )
    }

    serverResponse = (mcList) => {
        mcList.map(mc => {
            if (mc && mc.response && mc.response.status === 200) {
                let request = mc.request
                let data = mc.response.data
                if (request.method === endpoints.SHOW_CLOUDLET || request.method === endpoints.SHOW_ORG_CLOUDLET) {
                    this.cloudletList = [...this.cloudletList, ...data]
                }
                else if (request.method === endpoints.SHOW_APP_INST) {
                    this.appInstList = [...this.appInstList, ...data]
                }
                else if (request.method === endpoints.SHOW_CLUSTER_INST) {
                    this.clusterInstList = [...this.clusterInstList, ...data]
                }
                else if (request.method === endpoints.SHOW_ORG) {
                    this.organizationList = [...this.organizationList, ...data]
                }
            }
        })

        let forms = cloneDeep(this.state.forms)
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i]
            if (form.field === fields.selector) {
                form.rules.disabled = false
            }
            this.updateUI(form)
        }

        this.setState({
            forms: forms,
            loading: false
        })
    }

    fetchData = () => {
        let requestList = []
        requestList.push(showOrganizations())
        this.regions.map(region => {
            requestList.push(showCloudlets({ region }))
            requestList.push(showAppInsts({ region }))
            requestList.push(showClusterInsts({ region }))
        })
        sendRequests(requestList, this.serverResponse)
    }

    componentDidMount() {
        this.getFormData(this.props.data);
        this.fetchData()
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleViewMode: (data) => { dispatch(actions.viewMode(data)) }
    };
};

export default withRouter(connect(null, mapDispatchProps)(FlavorReg));