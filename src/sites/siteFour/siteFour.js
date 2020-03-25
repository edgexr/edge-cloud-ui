import React from 'react';
import { Header, Button, Icon } from 'semantic-ui-react';
import sizeMe from 'react-sizeme';

import { withRouter } from 'react-router-dom';
import { Motion } from "react-motion";
import { Steps, Hints } from 'intro.js-react';

//redux
import { connect } from 'react-redux';
import * as actions from '../../actions';

import { GridLoader } from "react-spinners";

import SideNav from './defaultLayout/sideNav'


import * as serviceMC from '../../services/serviceMC';

import { organizationTutor, CloudletTutor } from '../../tutorial';

import Alert from 'react-s-alert';

import '../../css/introjs.css';
import '../../css/introjs-dark.css';

let defaultMotion = { left: window.innerWidth / 2, top: window.innerHeight / 2, opacity: 1 }
let _self = null
const orgaSteps = organizationTutor();
const cloudletSteps = CloudletTutor();

class SiteFour extends React.Component {
    constructor(props) {
        super(props);
        _self = this
        let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null
        this.state = {
            contHeight: 0,
            contWidth: 0,
            bodyHeight: 0,
            headerTitle: '',
            activeItem: 'Organizations',
            page: 'pg=0',
            email: store ? store.email : 'Administrator',
            role: '',
            userToken: null,
            userName: '',
            regions: [
                { key: 1, text: 'All', value: 'All' },
            ],
            setMotion: defaultMotion,
            OrganizationName: '',
            adminShow: false,
            viewMode: 'listView',
            currentVersion: 'v-',
            searchChangeValue: 'Username',
            menuClick: false,
            showItem: false,
            learned: false,
            stepsEnabled: false,
            initialStep: 0,
            steps: [],
            enable: false,
            hideNext: true,
            regionToggle: false,
            intoCity: false,
            fullPage: null,
            menuW: 240,
            selectRole: ''
        };

        this.headerH = 70;
        this.hgap = 0;
    }

    gotoUrl(site, subPath) {
        let mainPath = site;
        _self.props.history.push({
            pathname: site,
            search: subPath
        });
        _self.props.history.location.search = subPath;
        _self.props.handleChangeSite({ mainPath: mainPath, subPath: subPath })
        _self.setState({ page: subPath })
    }

    handleItemClick(id, label, pg, role) {
        localStorage.setItem('selectMenu', label)
        _self.setState({ menuClick: true })
        _self.props.handleDetail({ data: null, viewMode: 'listView' })
        _self.props.handleChangeViewBtn(false);
        _self.props.handleChangeClickCity([]);
        _self.props.handleChangeComputeItem(label);
        _self.props.handleSearchValue('')
        _self.props.handleChangeRegion('All')
        _self.props.history.push({
            pathname: '/site4',
            search: "pg=" + pg
        });
        _self.props.history.location.search = "pg=" + pg;
        _self.props.handleChangeStep(pg)
        _self.setState({ page: 'pg=' + pg, activeItem: label, headerTitle: label, intoCity: false })
    }

    controllerOptions(option) {
        let arr = []
        if (option) {
            option.map((item) => {
                arr.push({
                    key: item.Region,
                    text: item.Region,
                    value: item.Region,
                    content: item.Region
                })
            })
        }
    }

    receiveControllerResult(mcRequest) {
        if (mcRequest) {
            if (mcRequest.response) {
                let response = mcRequest.response;
                _self.props.handleLoadingSpinner();
                _self.controllerOptions(response.data);
            }
        }
    }

    getAdminInfo = async (token) => {
        serviceMC.sendRequest(this, {
            token: token,
            method: serviceMC.getEP().SHOW_CONTROLLER
        }, _self.receiveControllerResult);
        _self.setState({ currentVersion: process.env.REACT_APP_BUILD_VERSION ? process.env.REACT_APP_BUILD_VERSION : 'v0.0.0' })
    }

    receiveAdminInfo = (mcRequest) => {
        if (mcRequest) {
            if (mcRequest.response) {
                let response = mcRequest.response;
                _self.props.handleRoleInfo(response.data)
                response.data.map((item, i) => {
                    if (item.role.indexOf('Admin') > -1) {
                        _self.setState({ adminShow: true });
                        localStorage.setItem('selectRole', item.role)
                    }
                })
            }
        }
    }

    enalbeSteps = () => {
        let enable = false;
        let currentStep = null;

        if (_self.props.viewMode === 'detailView') return;

        let site = _self.props.siteName;
        let userName = (_self.props.userInfo && _self.props.userInfo.info) ? _self.props.userInfo.info.Name : '';
        if (_self.props.params.mainPath === "/site4" && _self.props.params.subPath === "pg=newOrg") {
            if (_self.props.changeStep === '02') {
                currentStep = orgaSteps.stepsNewOrg2;
            } else if (_self.props.changeStep === '03') {
                currentStep = orgaSteps.stepsNewOrg3;
            } else {
                currentStep = orgaSteps.stepsNewOrg;
            }


            enable = true;
        } else if (_self.props.params.subPath === "pg=0") {
            if (_self.props.dataExist) {
                if (localStorage.selectRole === 'AdminManager') {
                    currentStep = orgaSteps.stepsOrgDataAdmin;
                } else {
                    currentStep = orgaSteps.stepsOrgDataDeveloper;
                }
            } else {
                if (localStorage.selectRole === 'AdminManager') {
                    currentStep = orgaSteps.stepsOrgAdmin;
                } else {
                    currentStep = orgaSteps.stepsOrgDeveloper;
                }
            }

            enable = true;
        } else if (_self.props.params.subPath === "pg=2") {
            //Cloudlets
            if (localStorage.selectRole === 'DeveloperManager' || localStorage.selectRole === 'DeveloperContributor' || localStorage.selectRole === 'DeveloperViewer') {
                currentStep = cloudletSteps.stepsCloudletDev;
            } else {
                currentStep = cloudletSteps.stepsCloudlet;
            }
            enable = true;
        } else if (_self.props.params.subPath === "pg=3") {
            //Flavors
            currentStep = orgaSteps.stepsFlavors;
            enable = true;
        } else if (_self.props.params.subPath === "pg=4") {
            //Cluster Instances
            currentStep = orgaSteps.stepsClusterInst;
            enable = true;
        } else if (_self.props.params.subPath === "pg=5") {
            //Apps
            currentStep = orgaSteps.stepsApp;
            enable = true;
        } else if (_self.props.params.subPath === "pg=6") {
            //App Instances
            currentStep = orgaSteps.stepsAppInst;
            enable = true;
        } else if (_self.props.params.subPath === "pg=createClusterInst") {
            currentStep = orgaSteps.stepsClusterInstReg;
            enable = true;
        } else if (_self.props.params.subPath === "pg=createApp") {
            currentStep = orgaSteps.stepsCreateApp;
            enable = true;
        } else if (_self.props.params.subPath === "pg=createAppInst") {
            currentStep = orgaSteps.stepsCreateAppInst;
            enable = true;
        } else if (_self.props.params.subPath === "pg=createCloudlet") {
            currentStep = cloudletSteps.stepsCloudletReg;
            enable = true;
        } else if (_self.props.params.subPath === "pg=createFlavor") {
            currentStep = orgaSteps.stepsCreateFlavor;
            enable = true;
        }

        _self.setState({ steps: currentStep })

        let elmentName = (_self.steps) ? currentStep : null;
        //_self.steps.props.options.hideNext = true;
        let element = (elmentName) ? document.getElementsByClassName(elmentName[0].element.replace('.', '')) : [];
        if (enable) {
            console.log("elementelement111", element)
            _self.setState({ stepsEnabled: true, enable: true })
        }

    }

    UNSAFE_componentWillMount() {
        let store = JSON.parse(localStorage.PROJECT_INIT);
        _self.setState({
            activeItem: (localStorage.selectMenu) ? localStorage.selectMenu : 'Organizations',
            headerTitle: (localStorage.selectMenu) ? localStorage.selectMenu : 'Organizations'
        })


        if (store) {
            _self.getAdminInfo(store.userToken);
        } else {
            _self.gotoUrl('/logout')
        }
        setTimeout(() => {
            let elem = document.getElementById('animationWrapper')
            if (elem) {
            }
        }, 4000)

        _self.setState({ steps: orgaSteps.stepsZero, intoCity: false });
        //
        if (_self.props.params.subPath !== 'pg=audits') {
            _self.getDataAudit();
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        try {
            _self.setState({ bodyHeight: (window.innerHeight - _self.headerH) })
            _self.setState({ contHeight: (nextProps.size.height - _self.headerH) / 2 - _self.hgap })
            _self.setState({ contWidth: (window.innerWidth - _self.state.menuW) })
            _self.setState({ userToken: nextProps.userToken })
            _self.setState({ userName: (nextProps.userInfo && nextProps.userInfo.info) ? nextProps.userInfo.info.Name : null })

        } catch (e) {

        }
        if (nextProps.selectedOrg) {
            _self.setState({ selectOrg: nextProps.selectedOrg })
        }

        if (nextProps.params && nextProps.params.subPath) {
            let subPaths = nextProps.params.subPath;
            let subPath = '';
            let subParam = '';
            if (subPaths.indexOf('&org=')) {
                let paths = subPaths.split('&')
                subPath = paths[0];
                subParam = paths[1];
            }
            _self.setState({ page: subPath, OrganizationName: subParam })

        }

        if (nextProps.viewMode && localStorage.selectRole.indexOf('Developer') === -1) {
            _self.setState({ viewMode: nextProps.viewMode })
        } else {
            _self.setState({ viewMode: 'listView' })
        }

        if ((nextProps.alertInfo !== _self.props.alertInfo) && nextProps.alertInfo.mode) {
            Alert.closeAll();
            if (nextProps.alertInfo.mode === 'success') {

                Alert.success(nextProps.alertInfo.msg, {
                    position: 'top-right',
                    effect: 'slide',
                    beep: true,
                    timeout: 5000,
                    offset: 100
                });
            } else if (nextProps.alertInfo.mode === 'error') {
                Alert.error(nextProps.alertInfo.msg, {
                    position: 'top-right',
                    effect: 'slide',
                    beep: true,
                    timeout: 5000,
                    offset: 100,
                    html: true
                });
                //return(<MexMessage open={true} info={{error:400,message:nextProps.alertInfo.msg}}/>)


            }
            nextProps.handleAlertInfo('', '');
        }

        //set filters
        if (nextProps.tableHeaders) {
            _self.setState({ showItem: false })
            if (nextProps.tableHeaders.length) {
                _self.setState({ tableHeaders: nextProps.tableHeaders })
            } else {

            }
        }

        // set step value of guide

        // saved tutorial
        let tutorial = localStorage.getItem('TUTORIAL')

        let formKey = Object.keys(nextProps.formInfo);
        //let submitSucceeded = (nextProps.formInfo) ? nextProps.formInfo[formKey[0]]['submitSucceeded']: null
        if (formKey.length) {
            if (nextProps.formInfo[formKey[0]]['submitSucceeded']) {
                if (nextProps.formInfo[formKey[0]]['submitSucceeded'] === true) {
                    _self.setState({ stepsEnabled: false })
                }
            }
        }
        if (tutorial === 'done') {
            //_self.setState({stepsEnabled:false})
        }
        //
        let enable = true;
        setTimeout(() => {
            if (enable && !_self.state.learned && !tutorial) {
                _self.enalbeSteps();
                _self.setState({ stepsEnabled: true, learned: true })
                localStorage.setItem('TUTORIAL', 'done')
            }

        }, 1000)

        let site = _self.props.siteName;
        if (!_self.props.changeStep || _self.props.changeStep === '02') {
            _self.setState({ enable: true })
        } else {
            _self.setState({ enable: false })
        }

        if (nextProps.regionInfo.region.length && !_self.state.regionToggle) {

            let getRegions = []
            _self.setState({ regionToggle: true })
            if (nextProps.regionInfo.region) {
                nextProps.regionInfo.region.map((region, i) => {
                    getRegions.push({ key: i + 2, text: region, value: region })
                })
            }
            let newRegions = Object.assign([], _self.state.regions).concat(getRegions)
            _self.setState({ regions: newRegions })

        }
        if (nextProps.clickCity.length > 0) {
            _self.setState({ intoCity: true })
        } else {
            _self.setState({ intoCity: false })
        }

        //set category
        if (nextProps.detailData !== _self.props.detailData) {
            // alert(JSON.stringify(nextProps.detailData))
            _self.setState({ detailData: nextProps.detailData })
        }

    }

    componentWillUnmount() {
        _self.setState({ learned: false })
    }

    searchChange = (e, { value }) => {
        _self.setState({ searchChangeValue: value })
        _self.props.handleSearchValue(_self.props.searchValue, value)
    }


    options = [
        {
            key: 1,
            text: 'Mobile',
            value: 1,
            content: <Header icon='mobile' content='Mobile' subheader='The smallest size' />,
        },
        {
            key: 2,
            text: 'Tablet',
            value: 2,
            content: <Header icon='tablet' content='Tablet' subheader='The size in the middle' />,
        },
        {
            key: 3,
            text: 'Desktop',
            value: 3,
            content: <Header icon='desktop' content='Desktop' subheader='The largest size' />,
        },
    ]

    onExit() {
        _self.setState({ stepsEnabled: false })
    }


    /**
     * audit
     * */
    reduceAuditCount(all, data) {
        let itemArray = [];
        let addArray = [];
        let savedArray = localStorage.getItem('auditUnChecked');
        let checkedArray = localStorage.getItem('auditChecked');
        let checked = [];
        all.map((item, i) => {
            if (savedArray && JSON.parse(savedArray).length) {
                //이전에 없던 데이터 이면 추가하기
                if (JSON.parse(savedArray).findIndex(k => k == item.traceid) === -1) addArray.push(item.traceid)
            } else {
                itemArray.push(item.traceid)
            }
        })

        if (addArray.length) {
            JSON.parse(savedArray).concat(addArray);
        }

        let checkResult = null;

        if (savedArray && JSON.parse(savedArray).length) {
            checkResult = JSON.parse(savedArray);
        } else if (itemArray.length) {
            checkResult = itemArray;
        }

        checked = (checkedArray) ? JSON.parse(checkedArray) : [];
        _self.props.handleAuditCheckCount(checkResult.length - checked.length)
        localStorage.setItem('auditUnChecked', JSON.stringify(checkResult))
    }

    receiveResult = (mcRequest) => {
        if (mcRequest) {
            if (mcRequest.response) {
                let response = mcRequest.response;
                let request = mcRequest.request;
                let checked = localStorage.getItem('auditChecked')
                if (request.method === serviceMC.getEP().SHOW_SELF) {
                    _self.reduceAuditCount(response.data, checked)
                }
            }
        }
        _self.props.handleLoadingSpinner(false);
    }

    getDataAudit = () => {
        let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null
        _self.setState({ devData: [] })
        _self.loadCount = 0;
        serviceMC.sendRequest(this, {
            token: store.userToken,
            method: serviceMC.getEP().SHOW_SELF,
            data: '{}',
            showMessage: false
        }, _self.receiveResult)
    }

    render() {
        const { stepsEnabled, initialStep, hintsEnabled, hints, steps } = _self.state;
        return (
            <div className='view_body'>
                {steps ?
                    <Steps
                        enabled={stepsEnabled}
                        steps={steps}
                        initialStep={initialStep}
                        onExit={_self.onExit}
                        showButtons={true}
                        options={{ hideNext: false }}
                        ref={steps => (_self.steps = steps)}
                    /> : null}
                {hints ?
                    <Hints
                        enabled={hintsEnabled}
                        hints={hints}
                    /> : null}
                {(_self.props.loadingSpinner == true) ?
                    <div className="loadingBox" style={{ zIndex: 9999 }}>
                        <GridLoader
                            sizeUnit={"px"}
                            size={25}
                            color={'#70b2bc'}
                            loading={_self.props.loadingSpinner}
                        />
                    </div> : null}
                <SideNav onOptionClick={_self.handleItemClick} email={_self.state.email} data={_self.props.userInfo.info} helpClick={_self.enalbeSteps} gotoUrl={_self.gotoUrl} />
                <Motion defaultStyle={defaultMotion} style={_self.state.setMotion}>
                    {interpolatingStyle => <div style={interpolatingStyle} id='animationWrapper'></div>}
                </Motion>
            </div>
        );
    }

};

const mapStateToProps = (state) => {
    let viewMode = null;
    if (state.changeViewMode.mode && state.changeViewMode.mode.viewMode) {
        viewMode = state.changeViewMode.mode.viewMode;
    }
    let tutorState = (state.tutorState) ? state.tutorState.state : null;
    let formInfo = (state.form) ? state.form : null;
    let submitInfo = (state.submitInfo) ? state.submitInfo : null;
    let regionInfo = (state.regionInfo) ? state.regionInfo : null;
    let checkedAudit = (state.checkedAudit) ? state.checkedAudit.audit : null;
    let detailData = (state.changeViewMode && state.changeViewMode.mode) ? state.changeViewMode.mode.data : null;
    let selectedOrg = (state.selectOrganiz) ? state.selectOrganiz.org : null;


    return {
        viewBtn: state.btnMnmt ? state.btnMnmt : null,
        userToken: (state.userToken) ? state.userToken : null,
        userInfo: state.userInfo ? state.userInfo : null,
        userRole: state.showUserRole ? state.showUserRole.role : null,
        selectOrg: state.selectOrg.org ? state.selectOrg.org : null,
        loadingSpinner: state.loadingSpinner.loading ? state.loadingSpinner.loading : null,
        injectData: state.injectData ? state.injectData : null,
        viewMode: viewMode,
        alertInfo: {
            mode: state.alertInfo.mode,
            msg: state.alertInfo.msg
        },
        searchValue: (state.searchValue.search) ? state.searchValue.search : null,
        changeRegion: (state.changeRegion.region) ? state.changeRegion.region : null,
        tableHeaders: (state.tableHeader) ? state.tableHeader.headers : null,
        filters: (state.tableHeader) ? state.tableHeader.filters : null,
        siteName: (state.siteChanger) ? state.siteChanger.site : null,
        changeStep: (state.changeStep.step) ? state.changeStep.step : null,
        dataExist: state.dataExist.data,
        tutorState: tutorState,
        formInfo: formInfo,
        submitInfo: submitInfo,
        regionInfo: regionInfo,
        audit: checkedAudit,
        clickCity: state.clickCityList.list,
        detailData: detailData,
        selectedOrg
    }
};

const mapDispatchProps = (dispatch) => {
    return {
        handleChangeSite: (data) => {
            dispatch(actions.changeSite(data))
        },
        handleChangeStep: (data) => {
            dispatch(actions.changeStep(data))
        },
        handleInjectData: (data) => {
            dispatch(actions.injectData(data))
        },
        handleChangeViewBtn: (data) => {
            dispatch(actions.btnManagement(data))
        },
        handleChangeComputeItem: (data) => {
            dispatch(actions.computeItem(data))
        },
        handleChangeClickCity: (data) => {
            dispatch(actions.clickCityList(data))
        },
        handleUserInfo: (data) => {
            dispatch(actions.userInfo(data))
        },
        handleSearchValue: (data, value) => {
            dispatch(actions.searchValue(data, value))
        },
        handleChangeRegion: (data) => {
            dispatch(actions.changeRegion(data))
        },
        handleSelectOrg: (data) => {
            dispatch(actions.selectOrganiz(data))
        },
        handleUserRole: (data) => {
            dispatch(actions.showUserRole(data))
        },
        handleComputeRefresh: (data) => {
            dispatch(actions.computeRefresh(data))
        },
        handleLoadingSpinner: (data) => {
            dispatch(actions.loadingSpinner(data))
        },
        handleDetail: (data) => {
            dispatch(actions.changeDetail(data))
        },
        handleRoleInfo: (data) => {
            dispatch(actions.roleInfo(data))
        },
        handleAlertInfo: (mode, msg) => {
            dispatch(actions.alertInfo(mode, msg))
        },
        handleAuditCheckCount: (data) => {
            dispatch(actions.setCheckedAudit(data))
        },
        handleResetMap: (data) => {
            dispatch(actions.resetMap(data))
        }
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(sizeMe({ monitorHeight: true })(SiteFour)));
