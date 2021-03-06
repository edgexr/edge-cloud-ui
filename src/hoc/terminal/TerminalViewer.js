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


import React, { Component, Suspense, lazy } from 'react';
import * as actions from "../../actions";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Image, Label } from 'semantic-ui-react';
import * as style from './TerminalStyle';
import { Paper, Box } from '@material-ui/core';
import MexForms, { INPUT, MULTI_FORM, SELECT, SWITCH } from '../forms/MexForms';
import { localFields } from '../../services/fields'
import { redux_org } from '../../helper/reduxData';
import { endpoint, service } from '../../services'
import { perpetual } from '../../helper/constant';
import { componentLoader } from '../loader/componentLoader';
import './style.css'

const Terminal = lazy(() => componentLoader(import('./MexTerminal')));

class TerminalViewer extends Component {

    constructor(props) {
        super(props)
        this.state = ({
            status: this.props.data.vm ? 'Connected' : 'Not Connected',
            statusColor: this.props.data.vm ? 'green' : 'red',
            open: false,
            forms: [],
            cmd: '',
            optionView: true,
            containerIds: [],
            vmURL: null,
            isVM: false,
            tempURL: undefined
        })
        this.ws = undefined
        this.request = redux_org.role(this) === perpetual.DEVELOPER_VIEWER ? perpetual.SHOW_LOGS : perpetual.RUN_COMMAND
        this.localConnection = null;
        this.sendChannel = null;
        this.vmPage = React.createRef()
    }

    sendRequest = async (terminaData) => {
        let execRequest =
        {
            app_inst_key:
            {
                app_key:
                {
                    organization: this.props.data[localFields.organizationName],
                    name: this.props.data[localFields.appName],
                    version: this.props.data[localFields.version]
                },
                cluster_inst_key:
                {
                    cluster_key: { name: this.props.data[localFields.clusterName] },
                    cloudlet_key: { organization: this.props.data[localFields.operatorName], name: this.props.data[localFields.cloudletName] },
                    organization: this.props.data[localFields.clusterdeveloper]
                }
            },
        }

        let method = ''
        if (this.state.isVM) {
            method = endpoint.SHOW_CONSOLE
        }
        else {
            execRequest.container_id = terminaData.Container
            if (terminaData.Request === perpetual.RUN_COMMAND) {
                method = endpoint.RUN_COMMAND;
                execRequest.cmd = { command: terminaData.Command }
            }
            else if (terminaData.Request === perpetual.SHOW_LOGS) {
                method = endpoint.SHOW_LOGS;
                let showLogs = terminaData.ShowLogs
                let tail = showLogs.Tail ? parseInt(showLogs.Tail) : undefined
                execRequest.log = showLogs ? { since: showLogs.Since, tail: tail, timestamps: showLogs.Timestamps, follow: showLogs.Follow } : {}
            }
        }

        let requestedData = {
            region: this.props.data[localFields.region],
            execRequest: execRequest
        }

        let request = {
            method: method,
            data: requestedData
        }
        let mc = await service.authSyncRequest(this, request)
        if (mc) {
            if (mc.response && mc.response.data) {
                let data = mc.response.data;
                let url = data.access_url
                if (url) {
                    if (this.state.isVM) {
                        this.setState({ vmURL: url })
                        if (this.vmPage && this.vmPage.current) {
                            this.vmPage.current.focus()
                        }
                    }
                    else {
                        this.setState({ tempURL: url, forceClose: false })
                    }
                }
                else {
                    this.props.handleAlertInfo('error', 'Access denied')
                    this.close()
                    this.setState({
                        tempURL: undefined,
                        optionView: true,
                    })
                }
            }
            else if (mc.error) {
                this.close()
                this.setState({
                    tempURL: undefined,
                    optionView: true,
                })
            }
        }
        else {
            this.close()
        }
    }

    openTerminal = (data) => {
        this.sendRequest(data)
    }

    start = () => {
        this.setState({
            open: true
        })
    }

    onTerminalClose = () => {
        this.close()
        if (this.state.optionView && this.props.onClose) {
            this.props.onClose()
        }
    }

    close = () => {
        if (this.ws) {
            this.ws.close()
        }
        this.setState({
            optionView: true,
            statusColor: 'red',
            status: 'Not Connected',
            tempURL: undefined,
        })
    }

    formattedData = () => {
        let data = {};
        let forms = this.state.forms;
        for (let i = 0; i < forms.length; i++) {
            let form = forms[i];
            if (form.field) {
                if (form.forms) {
                    data[form.uuid] = {};
                    let subForms = form.forms
                    for (let j = 0; j < subForms.length; j++) {
                        let subForm = subForms[j];
                        data[form.uuid][subForm.field] = subForm.value;
                    }

                }
                else {
                    data[form.field] = form.value;
                }
            }
        }
        return data
    }

    onConnect = (data) => {
        this.setState({
            forms: this.getForms(this.state.containerIds)
        })
        this.setState({
            statusColor: 'orange',
            status: "connecting",
            optionView: false
        })
        this.openTerminal(data)
    }

    getOptions = (dataList) => {
        return dataList.map(data => {
            return { key: data, value: data, text: data }
        })
    }

    getLogOptions = () => (
        [
            { field: 'Since', label: 'Since', formType: INPUT, visible: true, labelStyle: style.label, style: style.logs },
            { field: 'Tail', label: 'Tail', formType: INPUT, rules: { type: 'number' }, visible: true, labelStyle: style.label, style: style.logs },
            { field: 'Timestamps', label: 'Timestamps', formType: SWITCH, visible: true, labelStyle: style.label, style: { color: 'green' } },
            { field: 'Follow', label: 'Follow', formType: SWITCH, visible: true, labelStyle: style.label, style: { color: 'green' } }
        ]
    )

    getForms = (containerIds) => (
        [
            { field: 'Request', label: 'Request', formType: SELECT, rules: { required: true }, visible: true, labelStyle: style.label, style: style.cmdLine, options: this.getOptions(redux_org.role(this) === perpetual.DEVELOPER_VIEWER ? [perpetual.SHOW_LOGS] : [perpetual.RUN_COMMAND, perpetual.SHOW_LOGS]), value: this.request },
            { field: 'Container', label: 'Container', formType: SELECT, rules: { required: true }, visible: true, labelStyle: style.label, style: style.cmdLine, options: this.getOptions(containerIds), value: containerIds[0] },
            { field: 'Command', label: 'Command', formType: INPUT, rules: { required: true }, visible: this.request === perpetual.RUN_COMMAND ? true : false, labelStyle: style.label, style: style.cmdLine },
            { uuid: 'ShowLogs', field: 'LogOptions', formType: MULTI_FORM, visible: this.request === perpetual.SHOW_LOGS ? true : false, forms: this.getLogOptions(), width: 4 },
            { label: 'Connect', formType: 'Button', style: style.button, onClick: this.onConnect, validate: true }
        ])

    onValueChange = (currentForm) => {
        let forms = this.state.forms;
        if (currentForm.field === 'Request') {
            this.request = currentForm.value
            for (let form of forms) {
                if (form.field === 'Command') {
                    form.visible = currentForm.value !== perpetual.SHOW_LOGS
                }
                if (form.field === 'LogOptions') {
                    form.visible = currentForm.value === perpetual.SHOW_LOGS
                }
            }
            this.reloadForms()
        }
    }

    reloadForms = () => {
        this.setState({
            forms: this.state.forms
        })
    }

    loadHeader = () => (
        <Box display="flex" p={1}>
            <Box p={1} flexGrow={1}>
                <Image wrapped size='small' src='/assets/brand/logo_mex.svg' />
            </Box>
            {
                this.state.isVM ? null :
                    <Box p={1} alignSelf="flex-center">
                        <Label color={this.state.statusColor} style={{ color: 'white', fontFamily: 'Inconsolata, monospace', marginRight: 10 }}>{this.state.status}</Label>
                    </Box>
            }
            <Box p={1}>
                <div onClick={() => { this.onTerminalClose() }} style={{ cursor: 'pointer' }}>
                    <Label color='grey' style={{ color: 'white', fontFamily: 'Inconsolata, monospace', marginRight: 10 }}>{this.state.optionView ? 'CLOSE' : 'BACK'}</Label>
                </div>
            </Box>
        </Box>
    )

    loadVMPage = () => {
        const { vmURL } = this.state
        return vmURL ?
            <iframe title='VM' ref={this.vmPage} src={vmURL} style={{ width: '100%', height: window.innerHeight - 65 }}></iframe> : null
    }

    socketStatus = (flag, diff, ws) => {
        this.ws = ws
        this.setState({
            statusColor: flag ? 'green' : 'red',
            status: flag ? 'Connected' : 'Not Connected'
        })
        if (diff > 5000) {
            this.setState({ optionView: !flag, tempURL: undefined })
        }
    }

    loadCommandSelector = (containerIds) => {
        const { tempURL, forms, optionView } = this.state
        return (
            containerIds.length > 0 ?
                optionView ?
                    <div style={style.layout}>
                        <div style={style.container} align='center'>
                            <Paper variant="outlined" style={style.optionBody}>
                                <MexForms forms={forms} onValueChange={this.onValueChange} reloadForms={this.reloadForms} style={{}} />
                                <div>
                                    <p style={{ color: '#FFC107' }}>Note: Only running containers are accessible</p>
                                </div>
                            </Paper>
                        </div>
                    </div>
                    :
                    tempURL ?
                        <Suspense fallback={<div></div>}>
                            <div className={`${this.request === perpetual.RUN_COMMAND ? 'terminal_run_head' : 'terminal_log_head'}`}>
                                <Terminal status={this.socketStatus} url={tempURL} request={this.request} />
                            </div>
                        </Suspense> :
                        null
                : null)
    }

    render() {
        return (
            <div style={{ backgroundColor: 'black', height: 'inherit' }}>
                {this.loadHeader()}
                {
                    this.state.isVM ? this.loadVMPage() :
                        this.loadCommandSelector(this.state.containerIds)
                }
            </div>)
    }

    componentDidMount() {
        let data = this.props.data
        if (data[localFields.deployment] === perpetual.DEPLOYMENT_TYPE_VM) {
            this.setState({ isVM: true })
            setTimeout(() => { this.sendRequest() }, 1000)
        }
        else if (data[localFields.runtimeInfo] && data[localFields.runtimeInfo][localFields.container_ids]) {
            this.setState({ isVM: false })
            let tempContainerIds = data[localFields.runtimeInfo][localFields.container_ids];

            let containerIds = []
            for (let i = 0; i < tempContainerIds.length; i++) {
                let id = tempContainerIds[i]
                let containEnvoy = id.substring(0, 5)
                if (containEnvoy !== 'envoy') {
                    containerIds.push(id)
                }
            }
            if (containerIds.length > 0) {
                this.setState({
                    containerIds: containerIds,
                    forms: this.getForms(containerIds)
                })
            }
        }
    }

    componentWillUnmount() {
        this.close();
    }

}

const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data
    }
};
const mapDispatchProps = (dispatch) => {
    return {
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) }
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(TerminalViewer));
