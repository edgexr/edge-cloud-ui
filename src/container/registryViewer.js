import React from 'react';
import {Header, Button, Table, Icon, Input, Tab, Item} from 'semantic-ui-react';
import { connect } from 'react-redux';
import * as actions from '../actions';
import RGL, { WidthProvider } from "react-grid-layout";

import PopDetailViewer from './popDetailViewer';
import PopUserViewer from './popUserViewer';
import PopAddUserViewer from './popAddUserViewer';
import './styles.css';
import ContainerDimensions from 'react-container-dimensions'
import _ from "lodash";
import * as reducer from '../utils'
import MaterialIcon from "material-icons-react";
import * as services from '../services/service_compute_service';
import SiteFourCreateFormDefault from "./siteFourCreateFormDefault";
import Alert from "react-s-alert";
import * as service from "../services/service_compute_service";
const ReactGridLayout = WidthProvider(RGL);


const headerStyle = {
    backgroundImage: 'url()'
}
var horizon = 6;
var vertical = 20;
var layout = [
    {"w":19,"h":20,"x":0,"y":0,"i":"0","moved":false,"static":false, "title":"Developer"},
]
let _self = null;
const colors = [
    'red',
    'orange',
    'yellow',
    'olive',
    'green',
    'teal',
    'blue',
    'violet',
    'purple',
    'pink',
    'brown',
    'grey',
]

const panes = [
    { menuItem: 'k8s Deployment', render: (props) => <Tab.Pane attached={false}><SiteFourCreateFormDefault data={props} pId={0} getOptionData={props.regionF} flavorData={props.devOptionsF} onSubmit={() => console.log('submit form')}/></Tab.Pane> },
    { menuItem: 'Docker Deployment', render: (props) => <Tab.Pane attached={false}><SiteFourCreateFormDefault data={props} pId={0} onSubmit={() => console.log('submit form')}/></Tab.Pane> },
    { menuItem: 'VM Deployment', render: (props) => <Tab.Pane attached={false}><SiteFourCreateFormDefault data={props} pId={0} onSubmit={() => console.log('submit form')}/></Tab.Pane> },
]
class RegistryViewer extends React.Component {
    constructor(props) {
        super(props);
        _self = this;
        const layout = this.generateLayout();
        this.state = {
            layout,
            open: false,
            openAdd: false,
            openDetail:false,
            dimmer:false,
            activeItem:'',
            dummyData : [],
            detailViewData:null,
            selected:{},
            openUser:false,
            orgData:{},
            selectUse:null,
            resultData:null,
            devOptionsF:[]
        };
        this.keysData = [
            {
                'Region':{label:'Region', type:'RegionSelect', necessary:true, tip:'Allows developer to upload app info to different controllers', active:true, items:['US', 'EU']},
                'OrganizationName':{label:'Organization Name', type:'RenderInputDisabled', necessary:true, tip:null, active:true},
                'AppName':{label:'App Name', type:'RenderInput', necessary:true, tip:null, active:true},
                'Version':{label:'App Version', type:'RenderInput', necessary:true, tip:null, active:true},
                'ImagePath':{label:'Image Path', type:'RenderInput', necessary:true, tip:null, active:true},
                'DeploymentType':{label:'Deployment Type', type:'RenderSelect', necessary:true, tip:null, active:true, items:['Docker', 'Kubernetes', 'VM']},
                'ImageType':{label:'Image Type', type:'RenderInput', necessary:false, tip:'If Deployment Type Chosen as kubernetes, then image type is always ImageTypeDocker'},
                'DefaultFlavor':{label:'Default Flavor', type:'FlavorSelect', necessary:true, tip:null, active:true},
                'Ports':{label:'Ports', type:'CustomPorts', necessary:true, tip:'Like this udp:12001,tcp:80,http:7777', active:true, items:['tcp', 'udp']},
                'IpAccess':{label:'Ip Access', type:'IpSelect', necessary:false, tip:null, active:true, items:['IpAccessShared', 'IpAcessDedicaterd']},
                'Command':{label:'Command', type:'RenderInput', necessary:false, tip:'Please input a command that the container runs', active:true},
                'DeploymentMF':{label:'Deployment Manifest', type:'RenderTextArea', necessary:false, tip:'Specify either http url of the yaml or upload yaml file or helm chart', active:true},
            },
            {

            }
        ]
        this.fakeData = [
            {
                'Region':'',
                'OrganizationName':'',
                'AppName':'',
                'Version':'',
                'ImagePath':'',
                'DeploymentType':'',
                'ImageType':'',
                'DefaultFlavor':'',
                'Ports':'',
                'IpAccess':'',
                'Command':'',
                'DeploymentMF':'',
            }
        ]
        //this.hiddenKeys = ['CloudletLocation', 'URI', 'Mapped_ports']


    }

    onHandleClick(dim, data) {
        console.log('on handle click == ', data)
        this.setState({ dimmer:dim, open: true, selected:data })
        //this.props.handleChangeSite(data.children.props.to)
    }
    onHandleClicAdd(dim, data) {
        console.log('on handle click == ', data)
        this.setState({ dimmer:dim, openAdd: true, selected:data })
        //this.props.handleChangeSite(data.children.props.to)
    }
    getDataDeveloper(token) {
        //TODO: - get data cloudlet list , app list
        //services.getMCService('ShowCloudlet',{token:token,region:(this.props.region) ? this.props.region:'US'}, this.receiveResultCloudlet)
        //services.getMCService('ShowApps',{token:token,region:(this.props.region) ? this.props.region:'US'}, this.receiveResultApp)
    }
    receiveResultCloudlet = (result) => {
        //this.setState({orgData:result})
        console.log('submit result 1...', result)
    }
    receiveResultApp = (result) => {
        //this.setState({orgData:result})
        console.log('submit result 2...', result)
    }
    receiveResult (result) {
        console.log('result creat app ...', result.data.error)
        Alert.error(result.data.error, {
            position: 'top-right',
            effect: 'slide',
            onShow: function () {
                console.log('aye!')
            },
            beep: true,
            timeout: 5000,
            offset: 100
        });
    }

    onUseOrg(useData,key, evt) {
        console.log(useData,this.state.orgData.data,key)

        this.setState({selectUse:key})
        this.state.orgData.data.map((item,i) => {
            if(item.org == useData.Organization) {
                console.log('item role =',item.role)
                this.props.handleUserRole(item.role)
            }
        })

        this.props.handleSelectOrg(useData)
        
    }
    
    show = (dim) => this.setState({ dimmer:dim, openDetail: true })
    close = () => {
        this.setState({ open: false })
        this.props.handleInjectDeveloper(null)
    }
    closeDetail = () => {
        this.setState({ openDetail: false })
    }
    closeUser = () => {
        this.setState({ openUser: false })
    }
    closeAddUser = () => {
        this.setState({ openAdd: false })
    }


    generateDOM(open, dimmer, width, height, data, keysData, hideHeader) {

        let panelParams = {data:data, keys:keysData, regionF:this.getOptionData, devOptionsF:this.state.devOptionsF}

        return layout.map((item, i) => (

            (i === 0)?
                <div className="round_panel" key={i} style={{ width:width, minWidth:670, height:height, display:'flex', flexDirection:'column'}} >
                    <div className="grid_table" style={{width:'100%', height:height, overflowY:'auto'}}>

                        <Tab menu={{ secondary: true, pointing: true, inverted: true, attached: false, tabular: false }} panes={panes}{...panelParams} />

                    </div>
                </div>
                :
                <div className="round_panel" key={i} style={{ width:width, height:height, display:'flex', flexDirection:'column'}} >
                    <div style={{width:'100%', height:'100%', overflowY:'auto'}}>

                    </div>
                </div>


        ))
    }

    generateLayout() {
        const p = this.props;

        return layout
    }
    handleSort = clickedColumn => () => {
        const { column, dummyData, direction } = this.state

        if (column !== clickedColumn) {
            this.setState({
                column: clickedColumn,
                dummyData: _.sortBy(dummyData, [clickedColumn]),
                direction: 'ascending',
            })

            return
        }

        this.setState({
            dummyData: dummyData.reverse(),
            direction: direction === 'ascending' ? 'descending' : 'ascending',
        })
    }
    makeHeader(_keys, headL, visibles) {
        const { column, direction } = this.state
        let keys = Object.keys(_keys);
        //hide column filtered...
        let filteredKeys = (visibles) ? reducer.filterDefine(keys, visibles) : keys;

        let widthDefault = Math.round(16/filteredKeys.length);
        console.log('default width header -- ', widthDefault, filteredKeys)
        return filteredKeys.map((key, i) => (
            (i === filteredKeys.length -1) ?
                <Table.HeaderCell width={3} textAlign='center' sorted={column === key ? direction : null} onClick={this.handleSort(key)}>
                    {key}
                </Table.HeaderCell>
                :
                <Table.HeaderCell textAlign='center' width={(headL)?headL[i]:widthDefault} sorted={column === key ? direction : null} onClick={this.handleSort(key)}>
                    {key}
                </Table.HeaderCell>
        ));
    }

    onLayoutChange(layout) {
        //this.props.onLayoutChange(layout);
        console.log('changed layout = ', JSON.stringify(layout))
    }
    onPortClick() {

    }
    detailView(item) {
        console.log("user >>>> ",item)
        if(!item['UserName']){
            this.setState({detailViewData:item, openDetail:true})
        } else {
            this.setState({detailViewData:item, openUser:true})
        }
    }
    roleMark = (role) => (
        (role.indexOf('Developer')!==-1 && role.indexOf('Manager')!==-1) ? <div className="mark markD markM">M</div> :
        (role.indexOf('Developer')!==-1 && role.indexOf('Contributor')!==-1) ? <div className="mark markD markC">C</div> :
        (role.indexOf('Developer')!==-1 && role.indexOf('Viewer')!==-1) ? <div className="mark markD markV">V</div> :
        (role.indexOf('Operator')!==-1 && role.indexOf('Manager')!==-1) ? <div className="mark markO markM">M</div> :
        (role.indexOf('Operator')!==-1 && role.indexOf('Contributor')!==-1) ? <div className="mark markO markC">C</div> :
        (role.indexOf('Operator')!==-1 && role.indexOf('Viewer')!==-1) ? <div className="mark markO markV">V</div> : <div></div>
    )

    getOptionData = (region) => {
        console.log('computeItem@@',this.props.computeItem)
        if(this.props.computeItem == "Apps") {
            let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null
            // clusterFlavor
            service.getMCService('ShowFlavor',{token:store.userToken,region:region}, _self.receiveF)
        }
    }

    receiveF(result) {
        console.log('receive Flavor ==>>>>>>>>>>>> ', result)
        let arr = []
        result.map((item,i) => {
            arr.push(item.FlavorName)
        })
        _self.setState({devOptionsF: arr});
    }

    componentDidMount() {

        let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null
        if(store.userToken) {
            this.getDataDeveloper(store.userToken);

        } else {
            alert('Session Expired')
        }
        if(this.props.devData.length > 0) {
            this.setState({dummyData:this.props.devData, resultData:(!this.state.resultData)?this.props.devData:this.state.resultData})
        } else {
            this.setState({dummyData:this.fakeData, resultData:(!this.state.resultData)?this.props.devData:this.state.resultData})
        }

        /************
         * set Organization Name
         * **********/
        let assObj = Object.assign([], this.fakeData);
        assObj[0].OrganizationName = (this.props.selectOrg.Organization);
        console.log("jjjjkkkkkk",this.props.selectOrg.Organization);
        this.setState({fakeData:assObj});

    }
    componentWillReceiveProps(nextProps, nextContext) {
        console.log('nextProps',nextProps,this.props.siteId)
        if(nextProps.accountInfo){
            this.setState({ dimmer:'blurring', open: true })
        }

        ////////
        if(nextProps.devData.length > 1) {
            this.setState({dummyData:nextProps.devData, resultData:(!this.state.resultData)?nextProps.devData:this.state.resultData})
        } else {
            this.setState({dummyData:this.fakeData, resultData:(!this.state.resultData)?nextProps.devData:this.state.resultData})
        }
        ///////

        let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null

        if(nextProps.submitValues) {
            let serviceBody = {}
            console.log('submit on...', nextProps.submitValues)
            //TODO: // 20190430 add spinner...(loading)
            serviceBody = {
                "token":store.userToken,
                "params": nextProps.submitValues
            }
            services.createNewApp('CreateApp', serviceBody, _self.receiveResult)
        }
    }

    render() {
        const { open, dimmer, dummyData } = this.state;
        const { hiddenKeys } = this.props;
        return (
            <ContainerDimensions>
                { ({ width, height }) =>
                    <div style={{width:width, height:height, display:'flex', overflowY:'auto', overflowX:'hidden'}}>
                        {/*<RegistNewListItem data={this.state.dummyData} resultData={this.state.resultData} dimmer={this.state.dimmer} open={this.state.open} selected={this.state.selected} close={this.close}/>*/}
                        <ReactGridLayout
                            draggableHandle
                            layout={this.state.layout}
                            onLayoutChange={this.onLayoutChange}
                            {...this.props}
                            style={{width:width, height:height-20}}
                        >
                            {this.generateDOM(open, dimmer, width, height, dummyData, this.keysData, hiddenKeys)}
                        </ReactGridLayout>
                        <PopDetailViewer data={this.state.detailViewData} dimmer={false} open={this.state.openDetail} close={this.closeDetail}></PopDetailViewer>
                        <PopUserViewer data={this.state.detailViewData} dimmer={false} open={this.state.openUser} close={this.closeUser}></PopUserViewer>
                        <PopAddUserViewer data={this.state.selected} dimmer={false} open={this.state.openAdd} close={this.closeAddUser}></PopAddUserViewer>
                    </div>
                }
            </ContainerDimensions>

        );
    }
    static defaultProps = {
        className: "layout",
        items: 20,
        rowHeight: 30,
        cols: 12,
        width: 1600
    };
}
const createFormat = (data) => (
    {
        "region":data['Region'],
        "app":
            {
                "key":{"developer_key":{"name":data['OrganizationName']},"name":data['AppName'],"version":data['Version']},
                "image_path":data['ImagePath'],
                "image_type":Number(data['ImageType']),
                "access_ports":data['Portsselect']+":"+data['Ports'],
                "default_flavor":{"name":data['DefaultFlavor']},
                "cluster":{"name":""},
                "ipaccess":data['IpAccess'],
                "command":data['Command'],
                "deploymentType":data['DeploymentMF']
            }
    }
)
//'{"region":"US","app":{"key":{"developer_key":{"name":"kgh0505"},"name":"kghtest22","version":"1.0.0"},
//"image_path":"registry.mobiledgex.net:5000/mobiledgex/simapp",
//"image_type":1,"access_ports":"udp:12001,tcp:80,http:7777","default_flavor":{"name":"x1.medium"},"cluster":{"name":""},"ipaccess":"IpAccessShared","command":"test","deployment_manifest":"test1111"}}'
const mapStateToProps = (state) => {
    console.log("store state:::",state);
    let account = state.registryAccount.account;
    let dimm =  state.btnMnmt;
    console.log('account -- '+account)
    
    let accountInfo = account ? account + Math.random()*10000 : null;
    let dimmInfo = dimm ? dimm : null;
    let submitVal = null;
    if(state.form.createAppFormDefault && state.form.createAppFormDefault.values && state.form.createAppFormDefault.submitSucceeded) {
        console.log("state.form.createAppFormDefault.values@@",state.form.createAppFormDefault.values)
        let enableValue = reducer.filterDeleteKey(state.form.createAppFormDefault.values, 'Edit')
        submitVal = createFormat(enableValue)
        console.log("submitVal@@@@",submitVal)
    }
    let region = state.changeRegion
        ? {
            value: state.changeRegion.region
        }
        : {};

    return {
        accountInfo,
        dimmInfo,
        itemLabel: state.computeItem.item,
        userToken : (state.user.userToken) ? state.userToken: null,
        submitValues: submitVal,
        region: region,
        selectOrg : state.selectOrg.org?state.selectOrg.org:null,
        computeItem : state.computeItem?state.computeItem.item:null,

    }
    
    // return (dimm) ? {
    //     dimmInfo : dimm
    // } : (account)? {
    //     accountInfo: account + Math.random()*10000
    // } : null;
};
const mapDispatchProps = (dispatch) => {
    return {
        handleChangeSite: (data) => { dispatch(actions.changeSite(data))},
        handleInjectDeveloper: (data) => { dispatch(actions.registDeveloper(data))},
        handleUserRole: (data) => { dispatch(actions.showUserRole(data))},
        handleSelectOrg: (data) => { dispatch(actions.selectOrganiz(data))}
    };
};

export default connect(mapStateToProps, mapDispatchProps)(RegistryViewer);


