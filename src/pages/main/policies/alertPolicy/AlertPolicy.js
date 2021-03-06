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

import Reg from './Reg'
import { deleteAlertPolicy, keys, showAlertPolicy, multiDataRequest } from '../../../../services/modules/alertPolicy';
import { perpetual } from '../../../../helper/constant';
import { localFields } from '../../../../services/fields';
import { uiFormatter } from '../../../../helper/formatter';
import { showApps } from '../../../../services/modules/app';
import { redux_org } from '../../../../helper/reduxData';
import { developerRoles } from '../../../../constant';
import { appendSpaceToLetter } from '../../../../utils/string_utils';

class AlertPolicy extends React.Component {
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
        this.updateState({ currentView: <Reg onClose={this.onRegClose} /> });
    }

    onUpdate = (action, data) => {
        this.updateState({ currentView: <Reg data={data} action='Update' onClose={this.onRegClose} /> })
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
            { id: perpetual.ACTION_DELETE, label: 'Delete', onClick: deleteAlertPolicy, onFinish: this.onDelete, type: 'Edit' }
        ]
    }

    groupActionMenu = () => {
        return [
            { label: 'Delete', onClick: deleteAlertPolicy, icon: 'delete', warning: 'delete all the selected policies', type: 'Edit' },
        ]
    }

    dataFormatter = (key, data, isDetail) => {
        if (key.field === localFields.severity) {
            return uiFormatter.RenderSeverity(data, isDetail)
        }
        else if (key.field === localFields.triggerTime) {
            return isDetail ? appendSpaceToLetter(data[key.field]) : data[key.field]
        }
    }

    requestInfo = () => {
        return ({
            id: perpetual.PAGE_ALERT_POLICY,
            headerLabel: 'Alert Policy',
            requestType: [showAlertPolicy, showApps],
            isRegion: true,
            nameField: localFields.alertPolicyName,
            sortBy: [localFields.region, localFields.alertPolicyName],
            keys: this.keys,
            selection: true,
            onAdd: redux_org.isViewer(this) ? null : this.onAdd,
            formatData: this.dataFormatter,
            viewMode: undefined
        })
    }


    render() {
        const { currentView } = this.state
        return (
            <DataView id={perpetual.PAGE_ALERT_POLICY} resetView={this.resetView} actionMenu={this.actionMenu} actionRoles={developerRoles} currentView={currentView} requestInfo={this.requestInfo} groupActionMenu={this.groupActionMenu} multiDataRequest={multiDataRequest} />
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

export default withRouter(connect(mapStateToProps, mapDispatchProps)(AlertPolicy));