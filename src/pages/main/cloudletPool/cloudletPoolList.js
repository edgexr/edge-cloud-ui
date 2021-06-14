import React from 'react';
import DataView from '../../../container/DataView';
import { withRouter } from 'react-router-dom';
import * as actions from '../../../actions';
//redux
import { connect } from 'react-redux';
import * as constant from '../../../constant';
import { fields } from '../../../services/model/format';
import { redux_org } from '../../../helper/reduxData';
import { keys, showCloudletPools, deleteCloudletPool, multiDataRequest } from '../../../services/model/cloudletPool';
import CloudletPoolReg from './cloudletPoolReg';
import {HELP_CLOUDLET_POOL_LIST} from "../../../tutorial";
import { showConfirmation, showInvitation } from '../../../services/model/privateCloudletAccess';
import { ACTION_POOL_ACCESS_ADMIN_CONFIRM, ACTION_POOL_ACCESS_ADMIN_REMOVE, ACTION_POOL_ACCESS_DEVELOPER_REJECT } from '../../../constant/actions';
import { validateRole } from '../../../constant/role';
class CloudletPoolList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentView: null
        }
        this.keys = keys();
        this._isMounted = false
    }

    updateState = (data) => {
        if (this._isMounted) {
            this.setState({ ...data })
        }
    }

    resetView = () => {
        this.updateState({ currentView: null })
    }

    onAdd = () => {
        this.updateState({ currentView: <CloudletPoolReg onClose={() => this.resetView()} /> });
    }

    /**Action menu block */
    onActionClick = (action, data) => {
        this.updateState({ currentView: <CloudletPoolReg data={data} isUpdate={action ? true : false} action={action.id} onClose={() => this.resetView()} /> });
    }

    onOrgActionClick = (action, data) => {
        this.updateState({ currentView: <CloudletPoolReg data={data} org={true} isUpdate={action ? true : false} action={action.id} onClose={() => this.resetView()} /> });
    }

    showDeleteCloudletPool = (action, data) => {
        let valid = true
        if(data[fields.organizationCount] !== 0)
        {
            this.props.handleAlertInfo('error', 'Please unlink all organizations before deleting cloudlet pool');
            valid = false
        }
        return valid;
    }

    onConfirmVisible = (data) => {
        return redux_org.isAdmin(this)
    }

    actionMenu = () => {
        return [
            { id: constant.ADD_ORGANIZATION, label: 'Invite Organization', onClick: this.onOrgActionClick, type:'Edit' },
            { id: constant.DELETE_ORGANIZATION, label: 'Withdraw Invitation', onClick: this.onOrgActionClick, type:'Edit' },
            { id: ACTION_POOL_ACCESS_ADMIN_CONFIRM, label: 'Accept Invitation', visible: this.onConfirmVisible, onClick: this.onOrgActionClick, type:'Edit'  },
            { id: ACTION_POOL_ACCESS_DEVELOPER_REJECT, label: 'Reject Invitation', visible: this.onConfirmVisible, onClick: this.onOrgActionClick, type:'Edit'  },
            { id: ACTION_POOL_ACCESS_ADMIN_REMOVE, label: 'Withdraw Confirmation', visible: this.onConfirmVisible, onClick: this.onOrgActionClick, type:'Edit'  },
            { id: constant.ADD_CLOUDLET, label: 'Update Cloudlets', onClick: this.onActionClick, type:'Edit' },
            { id: constant.DELETE, label: 'Delete', onClickInterept:this.showDeleteCloudletPool, onClick: deleteCloudletPool, type:'Edit' }
        ]
    }

    groupActionMenu = () => {
        return [
            { label: 'Delete', onClick: deleteCloudletPool, icon: 'delete', warning: 'delete all the selected cloudlet pool', type: 'Edit' },
        ]
    }

    /*Action menu block*/

    requestInfo = () => {
        return ({
            id: constant.PAGE_CLOUDLET_POOLS,
            headerLabel: 'Cloudlet Pools',
            nameField: fields.poolName,
            requestType: [showCloudletPools, showConfirmation, showInvitation],
            isRegion: true,
            sortBy: [fields.poolName],
            selection:true,
            keys: this.keys,
            onAdd: validateRole(constant.operatorRoles, this.props.organizationInfo) ? this.onAdd : undefined,
            viewMode : HELP_CLOUDLET_POOL_LIST
        })
    }

    render() {
        const { currentView } = this.state
        return (
            <DataView id={constant.PAGE_CLOUDLET_POOLS} resetView={this.resetView} currentView={currentView} actionMenu={this.actionMenu} requestInfo={this.requestInfo} multiDataRequest={multiDataRequest} groupActionMenu={this.groupActionMenu} />
        )
    }

    componentDidMount(){
        this._isMounted = true
    }
    
    componentWillUnmount(){
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
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) }
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(CloudletPoolList));