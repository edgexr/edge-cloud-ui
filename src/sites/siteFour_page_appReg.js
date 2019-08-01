import React from 'react';
import { Tab } from 'semantic-ui-react';
import sizeMe from 'react-sizeme';
import { withRouter } from 'react-router-dom';
import MaterialIcon from 'material-icons-react';
//redux
import { connect } from 'react-redux';
import * as actions from '../actions';
import * as services from '../services/service_compute_service';
import './siteThree.css';

import Alert from "react-s-alert";
import RegistryViewer from "../container/registryViewer";



let _self = null;

class SiteFourPageAppReg extends React.Component {
    constructor(props) {
        super(props);
        _self = this;
        this.state = {
            shouldShowBox: true,
            shouldShowCircle: false,
            contHeight:0,
            contWidth:0,
            bodyHeight:0,
            activeItem: 'Developers',
            devData:[]
        };
        this.headerH = 70;
        this.hgap = 0;
        this.userToken = null;
    }
    gotoApp() {
        let mainPath = '/site4';
        let subPath = 'pg=6';
        _self.props.history.push({
            pathname: mainPath,
            search: subPath
        });
        _self.props.history.location.search = subPath;
        _self.props.handleChangeSite({mainPath:mainPath, subPath: subPath})
    }
    //go to
    gotoPreview(site) {
        //브라우져 입력창에 주소 기록
        let mainPath = site;
        let subPath = 'pg=0';
        _self.props.history.push({
            pathname: mainPath,
            search: subPath,
            state: { some: 'state' }
        });
        _self.props.history.location.search = subPath;
        _self.props.handleChangeSite({mainPath:mainPath, subPath: subPath})

    }
    handleItemClick = (e, { name }) => this.setState({ activeItem: name })

    onHandleRegistry() {
        this.props.handleInjectDeveloper('userInfo');
    }
    componentWillMount() {
        console.log('info..will mount ', this.columnLeft)
        this.setState({bodyHeight : (window.innerHeight - this.headerH)})
        this.setState({contHeight:(window.innerHeight-this.headerH)/2 - this.hgap})
    }
    componentWillUnmount() {
        
    }
    componentDidMount() {
        console.log('info.. ', this.childFirst, this.childSecond)
        let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null
        // console.log('info.. store == ', store)

        this.getDataDeveloper(store.userToken, this.props.region.value)
        // if(store.userToken) {
        //     if(this.props.region.value) {
        //         this.getDataDeveloper(store.userToken, this.props.region.value)
        //     }
        //     this.userToken = store.userToken;
        // } else {
        //     Alert.error('Invalid or expired token', {
        //         position: 'top-right',
        //         effect: 'slide',
        //         timeout: 5000
        //     });
        //     setTimeout(()=>_self.gotoPreview('/Logout'), 2000)
        // }
    }
    componentWillReceiveProps(nextProps) {
        this.setState({bodyHeight : (window.innerHeight - this.headerH)})
        this.setState({contHeight:(nextProps.size.height-this.headerH)/2 - this.hgap})


    }
    receiveResult(result) {
        console.log("receive == ", result)
        if(result.error) {
            this.props.handleAlertInfo('error',result.error.message)
        } else {
            _self.setState({devData:result})
        }
    }
    getDataDeveloper(token, region) {
        //services.getComputeService('app', this.receiveResult)
        services.getMCService('ShowApps',{token:token, region:(region === 'All') ? 'US' : region}, _self.receiveResult)
    }

    /*
     */
    render() {
        const {shouldShowBox, shouldShowCircle} = this.state;
        const { activeItem } = this.state
        return (

            <RegistryViewer devData={this.state.devData} gotoApp={this.gotoApp}/>
        );
    }

};
const mapStateToProps = (state) => {
    console.log('props in region === ', state.changeRegion)
    let region = state.changeRegion
        ? {
            value: state.changeRegion.region
        }
        : {};
    return {

        region:region
    }
};


const mapDispatchProps = (dispatch) => {
    return {
        handleChangeSite: (data) => { dispatch(actions.changeSite(data))},
        handleInjectData: (data) => { dispatch(actions.injectData(data))},
        handleInjectDeveloper: (data) => { dispatch(actions.registDeveloper(data))},
        handleAlertInfo: (mode,msg) => { dispatch(actions.alertInfo(mode,msg))}
    };
};

export default withRouter(connect(mapStateToProps, mapDispatchProps)(sizeMe({ monitorHeight: true })(SiteFourPageAppReg)));
