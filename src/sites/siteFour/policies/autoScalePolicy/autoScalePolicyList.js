import React from 'react';
import MexListView from '../../../../container/MexListView';
import { withRouter } from 'react-router-dom';
//redux
import { connect } from 'react-redux';
import * as actions from '../../../../actions';

import AutoScalePolicyReg from './autoScalePolicyReg'
import { keys, fields, showAutoScalePolicies, deleteAutoScalePolicy } from '../../../../services/model/autoScalePolicy';
import {PolicyTutor} from "../../../../tutorial";


const policySteps = PolicyTutor();

class AutoScalePolicy extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentView: null
        }
        this.keys = keys();
    }

    onRegClose = (isEdited)=>
    {
        this.setState({ currentView: null })
    }

    onAdd = () => {
        this.setState({ currentView: <AutoScalePolicyReg onClose={this.onRegClose} /> });
    }

    onUpdate = (action, data) => {
        this.setState({ currentView: <AutoScalePolicyReg data={data} action='Update' onClose={this.onRegClose}/> })
    }

    actionMenu = () => {
        return [
            { label: 'Update', onClick: this.onUpdate },
            { label: 'Delete', onClick: deleteAutoScalePolicy }
        ]
    }

    requestInfo = () => {
        return ({
            headerLabel: 'Auto Scale Policy',
            requestType: [showAutoScalePolicies],
            isRegion: true,
            nameField: fields.autoScalePolicyName,
            sortBy: [fields.region, fields.autoScalePolicyName],
            keys: this.keys,
            onAdd: this.onAdd,
            viewMode : policySteps.stepsPolicy
        })
    }


    render() {
        return (
            this.state.currentView ? this.state.currentView :
                <MexListView actionMenu={this.actionMenu()} requestInfo={this.requestInfo()} />
        )
    }
};

const mapStateToProps = (state) => {
    return {}
};
const mapDispatchProps = (dispatch) => {
    return {
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(AutoScalePolicy));