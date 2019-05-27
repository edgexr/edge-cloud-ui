import React, {Fragment} from 'react';
import {Form, Input, Grid, Tab} from 'semantic-ui-react';
import SiteFourCreateFormDefault from './siteFourCreateFormDefault';
import BubbleGroup from '../charts/bubbleGroup';
import EditMap from '../libs/simpleMaps/with-react-motion/editMap';
import ClustersMap from '../libs/simpleMaps/with-react-motion/index_clusters';
import * as services from "../services/service_compute_service";
import * as aggregate from "../utils";
import Alert from "react-s-alert";
import * as actions from "../actions";
import {connect} from "react-redux";
import {scaleLinear} from "d3-scale";
import {Field} from "redux-form";
import './styles.css';


const panes = [
    { menuItem: 'Select Cloudlet', render: (props) => <Tab.Pane>{cloudletMap(props, 'cloudlets')}</Tab.Pane> },
    { menuItem: 'Show Cluster', render: (props) => <Tab.Pane>{clusterNode(props)}</Tab.Pane> }
]

const renderLocationInput = field => (
    <div>
        <Form.Input
            {...field.input}
            type={field.type}
            placeholder={field.placeholder}
            onChange={field.change}
            //value={field.value}
            fluid
        />
    </div>

);

const clusterNode = (props) => (
    <Fragment>
        <Grid style={{margin:0, justifyContent:'center', backgroundColor:'rgba(0,0,0,.3)'}}>
            <Grid.Row>
                <label style={{fontSize:'1.5em'}}>Cluster</label>
            </Grid.Row>
            <Grid.Row>
                <BubbleGroup data={props.flavorConfig}></BubbleGroup>
            </Grid.Row>
            <Grid.Row>
                <div style={{display:'inline-block', verticalAlign: 'middle', marginRight:'20px'}}>
                    <div style={{display:'inline-block', width:24, height:24, verticalAlign: 'middle', backgroundColor: 'rgba(71, 82, 102, 0.65)', marginRight:'10px'}}></div>
                    <div style={{display:'inline-block'}}>Cluster</div>
                </div>
                <div style={{display:'inline-block', verticalAlign: 'middle', marginRight:'20px'}}>
                    <div style={{display:'inline-block', width:24, height:24, verticalAlign: 'middle', backgroundColor: '#ff7d77', marginRight:'10px'}}></div>
                    <div style={{display:'inline-block'}}>MasterNode</div>
                </div>
                <div style={{display:'inline-block', verticalAlign: 'middle'}}>
                    <div style={{display:'inline-block', width:24, height:24, verticalAlign: 'middle', backgroundColor: '#a2cbff', marginRight:'10px'}}></div>
                    <div style={{display:'inline-block'}}>Node</div>
                </div>
            </Grid.Row>
        </Grid>
        {/*<div style={{display:'flex', justifyContent:'center', width:'100%',backgroundColor:'rgba(0,0,0,.3)'}}  onClick={()=>console.log('45433',props)}>*/}
        {/*    <BubbleGroup data={props.flavorConfig}></BubbleGroup>*/}
        {/*</div>*/}
    </Fragment>
)
const cloudletMap = (props, type) => (
    <Fragment>
        {(type === 'cloudlets')?
        <div className='panel_worldmap' style={{width:'100%', height:600}}>
            <ClustersMap parentProps={{devData:props.cloudletData, reg:'cloudleAndClusterMap', zoomIn:()=>console.log('zoomin'), zoomOut:()=>console.log('zoomout'), resetMap:()=>console.log('resetmap') }} zoomControl={{center:[0, 0], zoom:1.5} }></ClustersMap>
        </div>

        :
        <EditMap parentProps={{devData:props.cloudletData}}></EditMap>}
        <Form>
            <Grid style={{margin:'0 -1rem'}}>
                <Grid.Row columns={2}>
                    <Grid.Column>
                        <Form.Field
                            id='form-input-control-first-name'
                            control={renderLocationInput}
                            label='Longitude'
                            placeholder='Longitude'
                        />
                    </Grid.Column>
                    <Grid.Column>
                        <Form.Field
                            id='form-input-control-first-name'
                            control={renderLocationInput}
                            label='Latitude'
                            placeholder='Latitude'
                        />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </Form>
        {/*<Grid>*/}
        {/*    <Grid.Row columns={2}>*/}
        {/*        <Grid.Column>*/}
        {/*            <span>Longitude</span>*/}
        {/*            <Input placeholder='Search...'/>*/}
        {/*        </Grid.Column>*/}
        {/*        <Grid.Column>*/}
        {/*            <span>Latitude</span>*/}
        {/*            <Input placeholder='Search...'/>*/}
        {/*        </Grid.Column>*/}
        {/*    </Grid.Row>*/}
        {/*</Grid>*/}
    </Fragment>
)
let _self = null;
class SiteFourCreateInstForm extends React.PureComponent {
    constructor() {
        super();
        this.state = {
            cloudletList:[],
            devOptionsOperator:[],
            devOptionsDeveloper:[],
            devOptionsCloudlet:[],
            devOptionsFour:[],
            devOptionsFive:[],
            devOptionsSix:[],
            devOptionsCF:[],
            devData:null,
            keys:null,
            region:'All',
            flavorConfig:null,
            clusterName:null,
            activeIndex:0,
            organizeData:[],
            cloudletData:[],
            flavorData:[],

        }
        _self = this;
        this.loopReqCount = 3; //cloudlet(operators), cluster, flavor
        this.regionCount = 2; // US, EU
    }
    zoomIn(detailMode) {

    }
    zoomOut(detailMode) {

    }
    resetMap(detailMode) {

    }
    locationLongLat() {

    }
    resetLoc = () => {
        this.setState({ locationLat: null,locationLong:null,toggle:false })
    }
    receiveResultOper(result) {
        console.log('operators ==>>>>>>>>>>>> ', result)
        let operArr = [];
        let CloudArr = [];


    }

    receiveResultOrg(result) {
        if(result.error) {
            Alert.error(result.error, {
                position: 'top-right',
                effect: 'slide',
                timeout: 5000
            });
        } else {
            _self.groupJoin(result,'organization')
        }
    }
    receiveResultCloudlet(result) {
        if(result.error) {
            Alert.error(result.error, {
                position: 'top-right',
                effect: 'slide',
                timeout: 5000
            });
        } else {
            _self.groupJoin(result,'cloudlet')
        }
    }
    receiveResultFlavor(result) {
        if(result.error) {
            Alert.error(result.error, {
                position: 'top-right',
                effect: 'slide',
                timeout: 5000
            });
        } else {
            _self.groupJoin(result,'flavor')
        }
    }

    generateCloudletItem(result) {
        let keys = this.state.keys;
        let cloudlet = aggregate.groupBy(result, 'CloudletName')
    }
    groupJoin(result,cmpt){

        console.log('cluster inst show app list.. ', result, cmpt)
        this.props.data.handleLoadingSpinner(false);

        if(cmpt == 'organization'){
            this.setState({organizeData : this.state.organizeData.concat(result)});
        }
        else if(cmpt == 'cloudlet') {
            this.setState({cloudletData : this.state.cloudletData.concat(result)});
        }
        else if(cmpt == 'flavor') {
            this.setState({flavorData : this.state.flavorData.concat(result)});
        }


        if(this.state.organizeData.length === this.regionCount && this.state.cloudletData.length  === this.regionCount && this.state.flavorData.length  === this.regionCount) {
            let clusterInst = this.state.organizeData;
            let cloudlet = this.state.cloudletData;
            let arr =[]
            clusterInst.map((itemCinst,i) => {
                cloudlet.map((itemClet,j) => {
                    if(itemCinst.Cloudlet == itemClet.CloudletName) {
                        itemCinst.CloudletLocation = itemClet.CloudletLocation;
                    }
                })
                arr.push(itemCinst)
            })
            //TODO: 20190516 set devData

        }
    }
    resetDevData(keys,field) {
        let tabNo = 0;
        let filteredKeys = aggregate.removeDuplicate(keys)
        let _keys = Object.assign({},_self.state.devData.keys[tabNo]);
        _keys[field].items = filteredKeys;
        _self.setState({keys: _keys})
    }
    resetDevInputData(keys,field) {
        let tabNo = 0;

    }
    onChangeFormState = (state) => {
        let organizKeys = [];
        let flavorKeys = [];
        let regions = aggregate.groupBy(_self.state.cloudletData, 'Region')
        if(state === 'Region') {
            let organiz = _self.state.organizeData;
            organiz.map(
                (aa) => organizKeys.push(aa.Organization)
            )
            _self.resetDevData(organizKeys, 'OrganizationName');
            //
            let operatorKeys = [];
            setTimeout(() => {
                let flavor = aggregate.groupBy(_self.state.flavorData, 'Region');
                flavor[_self.props.selectedRegion].map((ff) => flavorKeys.push(ff.FlavorName))
                _self.resetDevData(flavorKeys, 'Flavor')
                let operators = regions[_self.props.selectedRegion];
                if(operators) {
                    operators.map(
                        (aa) => operatorKeys.push(aa.Operator)
                    )
                    _self.resetDevData(operatorKeys, 'Operator');
                } else {
                    Alert.error('There is no operators in the Region', {
                        position: 'top-right',
                        effect: 'slide',
                        timeout: 5000
                    });
                }
            }, 500)


        } else if(state === 'OrganizationName') {
            let operatorKeys = [];
            setTimeout(() => {
                let operators = regions[_self.props.selectedRegion];
                if(operators) {
                    operators.map(
                        (aa) => operatorKeys.push(aa.Operator)
                    )
                    _self.resetDevData(operatorKeys, 'Operator');
                    _self.setState({activeIndex:0})
                    //TODO: 20190521 display cloudlet positioned on map

                }
            }, 500)
        } else if(state === 'Operator') {
            let cloudletKeys = [];
            setTimeout(() => {
                let regionArray = regions[_self.props.selectedRegion];
                if(regionArray) {
                    let cloudlets = aggregate.groupBy(regionArray, 'Operator')
                    if(cloudlets && cloudlets[_self.props.selectedOperator]){
                        cloudlets[_self.props.selectedOperator].map(
                            (aa) => cloudletKeys.push(aa.CloudletName)
                        )
                        _self.resetDevData(cloudletKeys, 'Cloudlet');
                    } else {
                        Alert.error('There is no Cloudlets in the Region', {
                            position: 'top-right',
                            effect: 'slide',
                            timeout: 5000
                        });
                    }

                } else {
                    Alert.error('There is no operators in', {
                        position: 'top-right',
                        effect: 'slide',
                        timeout: 5000
                    });
                }
            }, 500)
            _self.setState({activeIndex:0})
        } else if(state === 'Flavor') {

            setTimeout(() => {
                _self.setFlavorNode([_self.props.masterNumber,_self.props.nodeNumber]);
                //change TAB
                _self.setState({activeIndex:1})
            }, 500)
        } else if(state === 'NumberOfNode') {
            setTimeout(() => {
                //create node as inserted number
                _self.setFlavorNode([_self.props.masterNumber,_self.props.nodeNumber]);
                _self.setState({activeIndex:1})
            }, 500)
        }
    }
    setFlavorNode(keys, flavor) {
        let master = [];
        for( var i=0; i<Number(keys[0]); i++) {
            master.push(i)
        }
        let nodes = [];
        for( var j=0; j<Number(keys[1])+1; j++) {
            nodes.push(j)
        }
        const getChild = (value, idx) => (
            {
                "name": value,
                "value": idx === 0 ? 300 : 200,
                "color": idx === 0 ? "#ff7d77" : "#a2cbff"
            }
        )
        let flconfig = {
            "name": 'NO Name',
            "children": [
                {
                    "name": "Master",
                    "children": nodes.map((node, i) => getChild(flavor,i))
                }

            ]
        }
        console.log('input flavor ', flavor)
        _self.setState({flavorConfig:flconfig, clusterName:_self.props.clusterName})
    }

    getDataDeveloper = (region) => {
        let store = localStorage.PROJECT_INIT ? JSON.parse(localStorage.PROJECT_INIT) : null
        let rgn = ['US','EU'];
        //this.setState({devData:[]})
        if(region !== 'All'){
            rgn = [region]
        }
        console.log("dsssd@@",region,rgn)
        rgn.map((item) => {
            services.getMCService('ShowCloudlet',{token:store.userToken, region:item}, _self.receiveResultCloudlet)
            services.getMCService('ShowFlavor',{token:store.userToken, region:item}, _self.receiveResultFlavor)

        })

        services.getMCService('showOrg',{token:store.userToken}, _self.receiveResultOrg, _self)
    }
    handleTabChange = (e, { activeIndex }) => this.setState({ activeIndex })
    componentDidMount() {
        this.getDataDeveloper(this.props.data.region)


    }
    componentWillReceiveProps(nextProps, nextContext) {
        if(nextProps.data) this.setState({devData: nextProps.data, keys:nextProps.keys})
        //reset cluster and node count
        if(nextProps.nodeNumber || nextProps.selectedFlavor) {
            this.setFlavorNode([nextProps.masterNumber,nextProps.nodeNumber],nextProps.selectedFlavor);
        }

    }

    render() {
        const { activeIndex } = this.state;
        return (
            <Grid>
                <Grid.Row columns={2}>
                    <Grid.Column width={8}>
                        <SiteFourCreateFormDefault data={this.state.devData} pId={0} getUserRole={this.props.getUserRole} onSubmit={() => console.log('submit form')} onChangeState={this.onChangeFormState}></SiteFourCreateFormDefault>
                    </Grid.Column>
                    <Grid.Column width={8}>
                        <Tab activeIndex={activeIndex} onTabChange={this.handleTabChange} panes={panes}{...this.state}></Tab>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}

const mapStateToProps = (state) => {
    console.log("store state:::",state);
    let account = state.registryAccount.account;
    let dimm =  state.btnMnmt;
    console.log('account -- '+account)

    let accountInfo = account ? account + Math.random()*10000 : null;
    let dimmInfo = dimm ? dimm : null;
    let submitVal = null;
    let selectedRegion = null;
    let selectedCloudlet = null;
    let selectedOperator = null;
    let selectedFlavor = null;
    let flavors = null;
    let formValues = null;
    let clusterName = null;
    let masterNumber = null;
    let nodeNumber = null;


    if(state.form.createAppFormDefault) {
        formValues = state.form.createAppFormDefault.values;
        if(state.form.createAppFormDefault.values.Region !== "") {
            selectedRegion = state.form.createAppFormDefault.values.Region;
            //하위 오퍼레이터 리스트 아이템 변경
        }
        if(state.form.createAppFormDefault.values.Cloudlet !== "") {
            selectedCloudlet = state.form.createAppFormDefault.values.Cloudlet;
        }
        if(state.form.createAppFormDefault.values.Operator !== "") {
            selectedOperator = state.form.createAppFormDefault.values.Operator;
        }
        if(state.form.createAppFormDefault.values.Flavor !== "") {
            selectedFlavor = state.form.createAppFormDefault.values.Flavor;
        }
        if(state.form.createAppFormDefault.values.NumberOfNode !== "") {
            nodeNumber = state.form.createAppFormDefault.values.NumberOfNode;
            masterNumber = 1;
        }

    }



    return {
        selectedRegion, selectedOperator, clusterName, formValues, selectedFlavor, masterNumber, nodeNumber
    }
};
const mapDispatchProps = (dispatch) => {
    return {
        handleChangeSite: (data) => { dispatch(actions.changeSite(data))},
        handleInjectDeveloper: (data) => { dispatch(actions.registDeveloper(data))},
        handleUserRole: (data) => { dispatch(actions.showUserRole(data))},
        handleSelectOrg: (data) => { dispatch(actions.selectOrganiz(data))},
        handleLoadingSpinner: (data) => { dispatch(actions.loadingSpinner(data))}
    };
};

export default connect(mapStateToProps, mapDispatchProps)(SiteFourCreateInstForm);