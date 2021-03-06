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
import * as actions from '../../../actions';
//redux
import { connect } from 'react-redux';
import { localFields } from '../../../services/fields';
import { keys, iconKeys, showGPUDrivers, deleteGPUDriver } from '../../../services/modules/gpudriver';
import GPUDriverReg from './reg/Reg';
import BuildReg from './reg/BuildReg';
import { perpetual, role } from '../../../helper/constant';
import { uiFormatter } from '../../../helper/formatter';
import { operatorRoles } from '../../../constant';
import { DialogTitle, Icon, IconButton } from '../../../hoc/mexui';
import { getGPUDriverBuildURL } from '../../../services/modules/gpudriver/gpudriver';
import { Dialog, DialogContent, Typography } from '@material-ui/core';
import { lightGreen } from '@material-ui/core/colors';
import { parseDuration } from '../../../utils/date_util';
import { codeHighLighter } from '../../../hoc/highLighter/highLighter';
import { responseValid } from '../../../services/config';

const DetailAction = (props) => {
    const { data, onDone, self } = props
    const [loading, setLoading] = React.useState(false)

    const fetchDownloadURL = async (data) => {
        setLoading(true)
        let mc = await getGPUDriverBuildURL(self, data)
        setLoading(false)
        if (responseValid(mc)) {
            onDone({ request: data, response: mc.response.data })
        }
    }
    return (
        <div style={{ display: 'flex' }}>
            <IconButton style={{ color: lightGreen['A700'] }} loading={loading} tooltip='Get Download URL' onClick={() => { fetchDownloadURL(data) }}>
                <Icon>link</Icon>
            </IconButton>
        </div>
    )
}
class GPUDrivers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentView: null,
            downloadURL: undefined,
        }
        this._isMounted = false
        this.action = '';
        this.data = {}
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

    onAdd = (action, data) => {
        this.updateState({ currentView: <GPUDriverReg onClose={this.onRegClose}/> });
    }

    onBuild = (action, data) => {
        this.updateState({ currentView: <BuildReg onClose={this.onRegClose} data={data}/> });
    }

    /**Action menu block */
    actionMenu = () => {
        return [
            { id: perpetual.UPDATE_BUILD, label: 'Update Builds', onClick: this.onBuild, type: 'Edit' },
            { id: perpetual.ACTION_DELETE, label: 'Delete', onClick: deleteGPUDriver, type: 'Edit' },
        ]
    }

    groupActionMenu = () => {
        return [
            { label: 'Delete', onClick: deleteGPUDriver, icon: 'delete', warning: 'delete all the selected gpu drivers', type: 'Edit' }
        ]
    }

    dataFormatter = (key, data, isDetail) => {
        if (key.field === localFields.licenseConfig) {
            return uiFormatter.renderYesNo(key, data[key.field], isDetail)
        }
    }

    /*Action menu block*/

    requestInfo = () => {
        return ({
            id: perpetual.PAGE_GPU_DRIVER,
            headerLabel: 'GPU Drivers',
            nameField: localFields.gpuDriverName,
            isRegion: true,
            requestType: [showGPUDrivers],
            sortBy: [localFields.region, localFields.gpuDriverName],
            selection: true,
            keys: this.keys,
            iconKeys: iconKeys(),
            onAdd: role.validateRole(operatorRoles, this.props.organizationInfo) ? this.onAdd : undefined,
            formatData: this.dataFormatter
        })
    }

    onFetchComplete = (data) => {
        this.updateState({ downloadURL: data })
    }

    detailAction = (data) => {
        return <DetailAction data={data} onClick={this.fetchDownloadURL} self={this} onDone={this.onFetchComplete} />
    }

    render() {
        const { currentView, downloadURL } = this.state
        let request = undefined
        let response = undefined
        let downloadCmd = undefined
        if (downloadURL) {
            request = downloadURL.request
            response = downloadURL.response
            downloadCmd = `curl ${response['build_url_path']} -o <TARGET_PATH_NAME>`
        }
        return (
            <React.Fragment>
                <DataView id={perpetual.PAGE_FLAVORS} resetView={this.resetView} currentView={currentView} actionMenu={this.actionMenu} actionRoles={operatorRoles} requestInfo={this.requestInfo} groupActionMenu={this.groupActionMenu} detailAction={this.detailAction} />
                <Dialog open={Boolean(response)}>
                    <DialogTitle onClose={() => { this.updateState({ downloadURL: undefined }) }} label={'GPU Driver Build URL'}/>
                    {Boolean(response) ? <React.Fragment>
                        <br />
                        <DialogContent>
                            <ul>
                                <li>
                                    <Typography style={{ marginBottom: 10 }}>To download the GPU driver build on a VM, use the following command on it:</Typography>
                                </li>
                                {codeHighLighter(downloadCmd)}
                                <li>
                                    <Typography display='inline'>To download it directly, click here</Typography>
                                    <IconButton tooltip={'download'} onClick={(e) => window.location.href = response['build_url_path']} inline='true'>
                                        <Icon>get_app</Icon>
                                    </IconButton>
                                </li>
                                <li style={{ marginBottom: 10 }}>
                                    <Typography display='inline'>{`MD5 Sum: `}</Typography>
                                    <div style={{display:'inline'}}>{codeHighLighter(request[localFields.md5Sum])}</div>
                                </li>
                                <br/>
                                <Typography style={{ color: '#FFC107' }}>{`Note: The build URL is only valid for ${parseDuration(response['validity'])}`}</Typography>
                            </ul>
                        </DialogContent>
                    </React.Fragment> : null}
                </Dialog>
            </React.Fragment>
        )
    }

    componentDidMount() {
        this._isMounted = true
    }

    componentWillUnmount() {
        this._isMounted = false
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleAlertInfo: (mode, msg) => { dispatch(actions.alertInfo(mode, msg)) }
    };
};

const mapStateToProps = (state) => {
    return {
        organizationInfo: state.organizationInfo.data
    }
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(GPUDrivers));