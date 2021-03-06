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

import React, { Suspense, lazy } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import * as actions from '../../../../actions';
//redux
import { clusterEventLogs } from '../../../../services/modules/clusterInstEvent'
import { appInstEventLogs } from '../../../../services/modules/appInstEvent'
import { cloudletEventLogs } from '../../../../services/modules/cloudletEvent'
import { sendAuthRequest } from '../../../../services/worker/serverWorker'
import { showOrganizations } from '../../../../services/modules/organization'

import { localFields } from '../../../../services/fields';
import { redux_org } from '../../../../helper/reduxData'
import { withStyles } from '@material-ui/styles';
import * as dateUtil from '../../../../utils/date_util'
import sortBy from 'lodash/sortBy';
import { componentLoader } from '../../../../hoc/loader/componentLoader';
import { authRequest } from '../../../../services/service';
import EventWorker from '../../../../services/worker/event.worker';
import { defaultRange } from '../helper/constant';
import { responseValid } from '../../../../services/config';
import '../style.css'

const RightDrawer = lazy(() => componentLoader(import('./RightDrawer')));

const styles = theme => ({
    root: {
        display: 'flex',
        width: '100%',
        height: '100%'
    },
    grid_root: {
        flexGrow: 1,
    }
})

class UsageLog extends React.Component {
    constructor(props) {
        super(props);
        this._isMounted = false;
        this.state = {
            liveData: [],
            toggle: false,
            loading: false,
        }
        this.newRequest = false
        this.action = '';
        this.data = {};
        defaultRange(this)
        this.organizationList = []
    }

    /*Action menu block*/

    handleClose = () => {
        this.props.close()
    }

    serverResponse = (mc) => {
        if (this.newRequest) {
            this.newRequest = false
            this.setState({ liveData: [] })
        }
        if (responseValid(mc)) {
            let worker = new EventWorker()
            worker.postMessage({ ...mc })
            worker.addEventListener('message', async (event) => {
                let data = event.data
                if (data && data.length > 0) {
                    if (Object.keys(data[0]).length > 0) {
                        this.updateData(data[0])
                    }
                }
                worker.terminate()
            })
        }
        if (this._isMounted) { this.setState({ loading: false }) }
    }

    eventLogData = async (starttime, endtime) => {
        this.newRequest = true
        let regions = this.props.regions
        let orgInfo = redux_org.nonAdminOrg(this) ? this.props.organizationInfo : this.selectedOrg
        let isOperator = redux_org.isOperator(orgInfo)
        if (orgInfo) {
            if (regions && regions.length > 0) {
                regions.map(region => {
                    let data = {}
                    data[localFields.region] = region
                    data[localFields.starttime] = dateUtil.utcTime(dateUtil.FORMAT_FULL_T_Z, starttime)
                    data[localFields.endtime] = dateUtil.utcTime(dateUtil.FORMAT_FULL_T_Z, endtime)
                    data[localFields.organizationName] = orgInfo[localFields.organizationName]
                    if (isOperator) {
                        authRequest(this, { ...cloudletEventLogs(this, data), showMessage: false }, this.serverResponse, false)
                    }
                    authRequest(this, { ...clusterEventLogs(this, data, isOperator), showMessage: false }, this.serverResponse, false)
                    authRequest(this, { ...appInstEventLogs(this, data, isOperator), showMessage: false }, this.serverResponse, false)
                })
                if (this._isMounted) { this.setState({ loading: true }) }
            }
        }
    }

    onFetchData = (range) => {
        this.starttime = range.from
        this.endtime = range.to
        this.eventLogData(this.starttime, this.endtime)
    }

    render() {
        const { liveData, loading, toggle } = this.state
        return (
            <Suspense fallback={<div>loading</div>}>
                <RightDrawer close={this.handleClose} fetchData={this.onFetchData} endtime={this.endtime} toggle={toggle} liveData={liveData} loading={loading} organizationList={this.organizationList} onOrgChange={this.onOrganizationChange}/>
            </Suspense>
        )
    }

    updateData = (eventData) => {
        if (this._isMounted) {
            this.setState(prevState => {
                let liveData = prevState.liveData
                liveData.push(eventData)
                return { liveData, toggle: !prevState.toggle }
            })
        }
    }

    onOrganizationChange = (orgList) => {
        if (orgList.length > 0) {
            let org = orgList[0]
            if (this._isMounted) {
                this.setState({ liveData: {} })
            }
            defaultRange(this)
            this.selectedOrg = org
            this.eventLogData(this.starttime, this.endtime)
        }
    }

    orgResponse = (mc) => {
        if (responseValid(mc)) {
            this.organizationList = sortBy(mc.response.data, [item => item[localFields.organizationName]], ['asc']);
            defaultRange(this)
            if (this._isMounted) {
                this.setState({ liveData: {} })
            }
            this.eventLogData(this.starttime, this.endtime)
        }
    }

    componentDidMount() {
        this._isMounted = true;
        if (redux_org.isAdmin(this)) {
            sendAuthRequest(this, showOrganizations(), this.orgResponse)
        }
        else if (redux_org.nonAdminOrg(this)) {
            this.eventLogData(this.starttime, this.endtime)
        }
    }

    componentWillUnmount() {
        this._isMounted = false;
    }
};

const mapStateToProps = (state) => {
    return {
        regions: state.regionInfo.region,
        organizationInfo: state.organizationInfo.data,
        privateAccess: state.privateAccess.data,
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) },
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data)) },
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(withStyles(styles)(UsageLog)));