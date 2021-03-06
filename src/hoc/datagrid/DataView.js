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

import React from 'react'
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import DataGrid from './DataGrid';
import { operators, shared } from '../../helper/constant';
import { redux_org } from '../../helper/reduxData';
import { validateRole } from '../../helper/constant/role';

class DataView extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            visible: true
        }
    }

    resetOrRedirect = () => {
        if (this.props.currentView) {
            this.props.resetView()
        }
        if (!shared.isPathOrg(this)) {
            this.setState({ visible: false }, () => {
                this.setState({ visible: true })
            })
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps.organizationInfo && !operators.equal(nextProps.organizationInfo, this.props.organizationInfo)) {
            this.resetOrRedirect()
            return true
        }
        else if (nextState.visible !== this.state.visible || this.props.currentView !== nextProps.currentView) {
            return true
        }
        return false
    }

    filterActionMenu = () => {
        let actionRoles = this.props.actionRoles
        let actionMenu = this.props.actionMenu()
        if (actionMenu && actionMenu.length > 0 && (actionRoles === undefined || validateRole(actionRoles, this.props.organizationInfo))) {
            let viewerEdit = this.props.requestInfo.viewerEdit
            let menu = actionMenu.filter(action => {
                let valid = true
                if (action.type === 'Edit') {
                    if (redux_org.isViewer(this)) {
                        valid = false
                    }
                }
                return valid || viewerEdit
            })
            return menu
        }
    }

    render() {
        const { requestInfo, multiDataRequest, groupActionMenu, currentView, onClick, customToolbar, tableHeight, refreshToggle, toolbarAction, detailAction, handleListViewClick } = this.props
        const { visible } = this.state
        return (
            visible ?
                currentView ? currentView : <DataGrid actionMenu={this.filterActionMenu()} requestInfo={requestInfo()} multiDataRequest={multiDataRequest} groupActionMenu={groupActionMenu} onClick={onClick} customToolbar={customToolbar} tableHeight={tableHeight} refreshToggle={refreshToggle} toolbarAction={toolbarAction} detailAction={detailAction} handleListViewClick={handleListViewClick} /> : null
        )
    }

    componentDidMount() {
    }
}


const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data
    }
};

export default withRouter(connect(mapStateToProps, null)(DataView));