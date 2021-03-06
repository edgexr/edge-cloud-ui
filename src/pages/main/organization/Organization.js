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
import DataView from '../../../hoc/datagrid/DataView';
import { withRouter } from 'react-router-dom';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { localFields } from '../../../services/fields';
import { redux_org } from '../../../helper/reduxData';
import { keys, iconKeys, showOrganizations, deleteOrganization, edgeboxOnlyAPI, multiDataRequest } from '../../../services/modules/organization';
import OrganizationReg from './Reg';
import RoleWorker from '../../../services/worker/role.worker.js'
import { Box, Card, IconButton, Typography, CardHeader } from '@material-ui/core';
import { HELP_ORG_LIST } from "../../../tutorial";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { perpetual } from '../../../helper/constant';
import { uiFormatter } from '../../../helper/formatter'
import { authSyncRequest } from '../../../services/service';
import { validatePrivateAccess } from '../../../constant';
import { getUserMetaData } from '../../../helper/ls';
import { updateUserMetaData } from '../../../services/modules/users';
import { showUsers, showUser } from '../../../services/modules/users';
import { ACTION_REFRESH } from '../../../hoc/datagrid/MexToolbar';
import { ICON_COLOR } from '../../../helper/constant/colors';
import { showUserRoles } from '../../../services/modules/users/users';
import { fetchToken } from '../../../services/config';
import { splitByCaps, toFirstUpperCase } from '../../../utils/string_utils';

class OrganizationList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentView: null,
            tableHeight: redux_org.isViewer(this) ? undefined : 262
        }
        this._isMounted = false
        this.action = '';
        this.data = {}
        this.worker = new RoleWorker();
        this.keys = keys().filter(key => {
            let valid = true
            if (key.field === localFields.manage || key.field === localFields.role) {
                valid = !redux_org.isAdmin(this)
            }
            else if (key.field === localFields.type) {
                valid = redux_org.isAdmin(this)
            }
            return valid
        })
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    resetView = () => {
        if (this._isMounted) {
            this.updateState({ currentView: null })
        }
    }

    onRegClose = (isEdited) => {
        this.resetView()
    }

    onAddUser = (action, data) => {
        this.updateState({ currentView: <OrganizationReg data={data} action={action ? 'AddUser' : null} onClose={this.onRegClose} /> });
    }

    onAdd = (type) => {
        this.updateState({ currentView: <OrganizationReg onClose={this.onRegClose} type={type} /> });
    }

    onUpdate = (action, data) => {
        this.updateState({ currentView: <OrganizationReg data={data} isUpdate={true} onClose={this.onRegClose} /> });
    }

    customToolbar = () =>
    (
        <Box display='flex'>
            <Card style={{ margin: 10, width: '50%', maxHeight: 200, overflow: 'auto' }}>
                <CardHeader
                    avatar={
                        <IconButton aria-label="developer" disabled={true}>
                            <img src='/assets/images/handset-sdk-green.svg' alt="MobiledgeX" />
                        </IconButton>
                    }
                    title={
                        <Typography>
                            Create Organization to Run Apps on Operator Edge (Developers)
                        </Typography>
                    }
                    // subheader="Dynamically scale and deploy applications on Operator Edge geographically close to your end-users. Deploying to MobiledgeX's cloudlets provides applications the advantage of low latency, which can be extremely useful for real-time applications such as Augmented Reality, Mobile Gaming, Self-Driving Cars, Drones, etc."
                    action={
                        <IconButton aria-label="developer" onClick={() => { this.onAdd(perpetual.DEVELOPER) }}>
                            <ArrowForwardIosIcon style={{ fontSize: 20, color: ICON_COLOR }} />
                        </IconButton>
                    }
                />
            </Card>
            <Card style={{ margin: 10, width: '50%', maxHeight: 200, overflow: 'auto' }}>
                <CardHeader
                    avatar={
                        <IconButton aria-label="operator" disabled={true}>
                            <img src='/assets/images/cloudlet-green.svg' alt="MobiledgeX" />
                        </IconButton>
                    }
                    title={
                        <Typography>
                            Create Organization to Host Operator Edge (Operators)
                        </Typography>
                    }
                    // subheader='Register your cloudlet by providing MobiledgeX with a pool of compute resources and access to the OpenStack API endpoint by specifying a few required parameters, such as dynamic IP addresses, cloudlet names, location of cloudlets, certs, and more, using the Edge-Cloud Console. MobiledgeX relies on this information to remotely access the cloudlets to determine resource requirements as well as dynamically track usage.'
                    action={
                        <IconButton aria-label="operator" onClick={() => { this.onAdd(perpetual.OPERATOR) }}>
                            <ArrowForwardIosIcon style={{ fontSize: 20, color: ICON_COLOR }} />
                        </IconButton>
                    }
                />
            </Card>
        </Box>
    )

    /**Action menu block */
    onAudit = (action, data) => {
        this.props.handleShowAuditLog({ type: 'audit', org: data[localFields.organizationName] })
    }

    onDelete = async (data, success) => {
        if (success) {
            const roles = this.props.roleInfo.filter((role) => role[localFields.organizationName] !== data[localFields.organizationName])
            this.props.handleRoleInfo(roles)
            if (data[localFields.organizationName] === redux_org.orgName(this)) {
                let data = getUserMetaData()
                if (data && data[localFields.organizationInfo]) {
                    data[localFields.organizationInfo] = undefined
                    updateUserMetaData(this, data)
                    this.props.handleOrganizationInfo(undefined)
                }
            }
            if (this._isMounted) {
                this.forceUpdate()
            }
        }
    }

    onEdgebox = async (action, data, callback) => {
        let mc = await authSyncRequest(this, edgeboxOnlyAPI(data))
        if (mc && mc.response && mc.response.status === 200) {
            this.props.handleAlertInfo('success', `Edgebox ${data[localFields.edgeboxOnly] ? 'disabled' : 'enabled'} successfully for organization ${data[localFields.organizationName]}`)
            callback(mc)
        }
    }

    onPreEdgebox = (type, action, data) => {
        switch (type) {
            case perpetual.ACTION_LABEL:
                return data[localFields.edgeboxOnly] ? 'Disable Edgebox' : 'Enable Edgebox'
            case perpetual.ACTION_WARNING:
                return `${data[localFields.edgeboxOnly] ? 'disable' : 'enable'} edgebox feature for`
            case perpetual.ACTION_DISABLE:
                return data[localFields.type].includes(perpetual.DEVELOPER)
        }
    }

    adminVisibility = (type, action, data) => {
        return redux_org.isAdmin(this)
    }

    managerVisibility = (type, action, data) => {
        return redux_org.isManager(this)
    }

    actionMenu = () => {
        return [
            // { label: 'Audit', onClick: this.onAudit },
            { label: 'Add User', onClick: this.onAddUser, type: 'Edit', visibility: this.managerVisibility },
            { id: perpetual.ACTION_EDGE_BOX_ENABLE, label: this.onPreEdgebox, visibility: this.adminVisibility, type: 'Edit', warning: this.onPreEdgebox, disable: this.onPreEdgebox, onClick: this.onEdgebox },
            { id: perpetual.ACTION_UPDATE, label: 'Update', visibility: this.managerVisibility, onClick: this.onUpdate, type: 'Edit' },
            { id: perpetual.ACTION_DELETE, label: 'Delete', visibility: this.managerVisibility, onClick: deleteOrganization, onFinish: this.onDelete, type: 'Edit' }
        ]
    }

    cacheOrgInfo = (data, roleInfo) => {
        let organizationInfo = {}
        organizationInfo[localFields.organizationName] = data[localFields.organizationName]
        organizationInfo[localFields.type] = data[localFields.type]
        organizationInfo[localFields.edgeboxOnly] = data[localFields.edgeboxOnly]
        organizationInfo[localFields.role] = roleInfo[localFields.role]
        organizationInfo[localFields.username] = roleInfo[localFields.username]
        return organizationInfo
    }

    updatePrivateAccess = async (orgInfo) => {
        this.props.handlePrivateAccess(undefined)
        if (redux_org.isOperator(orgInfo)) {
            let privateAccess = await validatePrivateAccess(this, orgInfo)
            this.props.handlePrivateAccess(privateAccess)
        }
    }

    onManage = async (key, data) => {
        if (this.props.roleInfo) {
            let roleInfoList = this.props.roleInfo;
            for (let roleInfo of roleInfoList) {
                if (roleInfo[localFields.organizationName] === data[localFields.organizationName]) {
                    let organizationInfo = this.cacheOrgInfo(data, roleInfo)
                    this.props.handleOrganizationInfo(organizationInfo)
                    this.updateState({ tableHeight: redux_org.isViewer(organizationInfo) ? undefined : 271 })
                    this.updatePrivateAccess(organizationInfo)
                    break;
                }
            }
        }
    }

    onListViewClick = (key, data) => {
        switch (key.field) {
            case localFields.manage:
                this.onManage(key, data)
        }
    }

    dataFormatter = (key, data, isDetail) => {
        if (key.field === localFields.manage) {
            return <uiFormatter.Manage data={data} key={key} detail={isDetail} />
        }
        else if (key.field === localFields.edgeboxOnly) {
            return uiFormatter.edgeboxOnly(key, data, isDetail)
        }
        else if (key.field === localFields.type) {
            return <strong>{toFirstUpperCase(data[key.field])}</strong>
        }
        else if (key.field === localFields.role) {
            return redux_org.isAdmin(this) && isDetail ? undefined : <strong>{splitByCaps(data[key.field])}</strong>
        }
    }

    requestInfo = () => {
        return ({
            id: perpetual.PAGE_ORGANIZATIONS,
            headerLabel: 'Organizations',
            nameField: localFields.organizationName,
            requestType: [showOrganizations, showUsers, showUser],
            sortBy: [localFields.organizationName],
            keys: this.keys,
            iconKeys:iconKeys(),
            additionalDetail: uiFormatter.additionalDetail,
            viewMode: HELP_ORG_LIST,
            grouping: true,
            formatData: this.dataFormatter
        })
    }

    render() {
        const { tableHeight, currentView } = this.state
        return (
            <div style={{ width: '100%', height: '100%' }}>
                <DataView id={perpetual.PAGE_ORGANIZATIONS} multiDataRequest={multiDataRequest} resetView={this.resetView} currentView={currentView} actionMenu={this.actionMenu} requestInfo={this.requestInfo} onClick={this.onListViewClick} customToolbar={this.customToolbar} tableHeight={tableHeight} handleListViewClick={this.handleListViewClick} />
            </div>
        )
    }

    handleListViewClick = (item) => {
        const { type, data } = item
        switch (type) {
            case ACTION_REFRESH:
                this.props.handleRoleInfo(data)
                break;
            default:
        }
    }

    getUserRoles = () => {
        if (this._isMounted) {
            this.forceUpdate()
        }
    }

    refreshRole = async () => {
        let mc = await showUserRoles(this)
        if (mc && mc.response && mc.response.status === 200) {
            this.worker.postMessage({ data: mc.response.data, request: showOrganizations(), token: fetchToken(this) })
            this.worker.addEventListener('message', async (event) => {
                this.props.handleRoleInfo(event.data.roles)
            })
        }
    }

    componentDidUpdate(preProps, preState) {
        if (!redux_org.isAdmin(this) && this.state.currentView !== preState.currentView && this.state.currentView === null) {
            this.refreshRole()
        }
    }

    componentDidMount() {
        this._isMounted = true
        this.getUserRoles()
    }

    componentWillUnmount() {
        this._isMounted = false
    }
};

const mapStateToProps = (state) => {
    return {
        roleInfo: state.roleInfo ? state.roleInfo.role : null,
        organizationInfo: state.organizationInfo.data
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleRoleInfo: (data) => { dispatch(actions.roleInfo(data)) },
        handleShowAuditLog: (data) => { dispatch(actions.showAuditLog(data)) },
        handleOrganizationInfo: (data) => { dispatch(actions.organizationInfo(data)) },
        handlePrivateAccess: (data) => { dispatch(actions.privateAccess(data)) }
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(OrganizationList));
