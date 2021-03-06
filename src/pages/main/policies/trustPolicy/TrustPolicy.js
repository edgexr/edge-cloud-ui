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
import DataView from '../../../../hoc/datagrid/DataView';
import { withRouter } from 'react-router-dom';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../../actions';

import TrustPolicyReg from './Reg'
import { keys, showTrustPolicies, deleteTrustPolicy, multiDataRequest } from '../../../../services/modules/trustPolicy';
import { showCloudlets } from '../../../../services/modules/cloudlet';
import { HELP_TRUST_POLICY } from "../../../../tutorial";
import { operatorRoles } from '../../../../constant';
import { role, perpetual } from '../../../../helper/constant';
import { localFields } from '../../../../services/fields';
import { redux_org } from '../../../../helper/reduxData';

class TrustPolicy extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentView: null
        }
        this._isMounted = false
        this.keys = keys();
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    resetView = () => {
        this.updateState({ currentView: null })
    }

    onRegClose = (isEdited) => {
        this.resetView()
    }

    onAdd = () => {
        this.updateState({ currentView: <TrustPolicyReg onClose={this.onRegClose} /> });
    }

    onUpdate = (action, data) => {
        this.updateState({ currentView: <TrustPolicyReg data={data} action='Update' onClose={this.onRegClose} /> })
    }

    onDelete = (data, success, errorInfo) => {
        if (!success, errorInfo) {
            let cloudlets = []
            if (data[localFields.cloudlets]) {
                cloudlets = data[localFields.cloudlets]
            }
            if (errorInfo.message === 'Policy in use by Cloudlet') {
                this.props.handleAlertInfo('error', `Policy in use by Cloudlet${cloudlets.length > 1 ? 's' : ''} ${cloudlets.map(cloudlet => {
                    return ' ' + cloudlet
                })}`)
            }
        }
    }

    actionMenu = () => {
        return [
            { id: perpetual.ACTION_UPDATE, label: 'Update', onClick: this.onUpdate, type: 'Edit' },
            { id: perpetual.ACTION_DELETE, label: 'Delete', onClick: deleteTrustPolicy, onFinish: this.onDelete, type: 'Edit' }
        ]
    }

    groupActionMenu = () => {
        return [
            { label: 'Delete', onClick: deleteTrustPolicy, icon: 'delete', warning: 'delete all the selected policies', type: 'Edit' },
        ]
    }

    requestInfo = () => {
        return ({
            id: perpetual.PAGE_TRUST_POLICY,
            headerLabel: 'Trust Policy',
            requestType: [showTrustPolicies, showCloudlets],
            isRegion: true,
            nameField: localFields.trustPolicyName,
            sortBy: [localFields.region, localFields.trustPolicyName],
            keys: this.keys,
            selection: !redux_org.isDeveloper(this),
            onAdd: role.validateRole(operatorRoles, this.props.organizationInfo) ? this.onAdd : undefined,
            viewMode: HELP_TRUST_POLICY
        })
    }


    render() {
        const { currentView } = this.state
        return (
            <DataView id={perpetual.PAGE_TRUST_POLICY} resetView={this.resetView} actionMenu={this.actionMenu} actionRoles={operatorRoles} currentView={currentView} requestInfo={this.requestInfo} multiDataRequest={multiDataRequest} groupActionMenu={this.groupActionMenu} />
        )
    }

    componentDidMount() {
        this._isMounted = true
    }

    componentWillUnmount() {
        this._isMounted = false
    }
};

const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(TrustPolicy));