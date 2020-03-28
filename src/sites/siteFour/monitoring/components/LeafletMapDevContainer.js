import React from "react";
import * as L from 'leaflet';
import "../PageMonitoring.css";
import 'react-leaflet-fullscreen-control'
import type {TypeAppInstance, TypeClient} from "../../../../shared/Types";
import Ripples from "react-ripples";
import {CheckCircleOutlined} from '@material-ui/icons';
import {Map, Marker, Polyline, Popup, Rectangle, TileLayer, Tooltip,} from "react-leaflet";
import PageDevMonitoring from "../dev/PageDevMonitoring";
import CircularProgress from "@material-ui/core/CircularProgress";
import Control from 'react-leaflet-control';
import {groupByKey_, removeDuplicates, renderPlaceHolderLottiePinJump3} from "../PageMonitoringCommonService";
import MarkerClusterGroup from "leaflet-make-cluster-group";
import {Icon} from "semantic-ui-react";
import {Radio} from 'antd'
import {connect} from "react-redux";
import * as actions from "../../../../actions";
import {
    DARK_CLOUTLET_ICON_COLOR,
    DARK_LINE_COLOR,
    WHITE_CLOUTLET_ICON_COLOR,
    WHITE_LINE_COLOR
} from "../../../../shared/Constants";
import "leaflet-make-cluster-group/LeafletMakeCluster.css";
const DEFAULT_VIEWPORT = {
    center: [51.505, -0.09],
    zoom: 13,
}

let cellphoneIcon2 = L.icon({
    iconUrl: require('../images/cellhone_white003.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


let cloudGreenIcon = L.icon({
    iconUrl: require('../images/cloud_green.png'),
    //shadowUrl : 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png',
    iconSize: [40, 21],
    iconAnchor: [20, 21],
    shadowSize: [41, 41]
});

let cloudBlueIcon = L.icon({
    iconUrl: require('../images/cloud_blue2.png'),
    //shadowUrl : 'https://leafletjs.com/examples/custom-icons/leaf-shadow.png',
    iconSize: [45, 39],//todo: width, height
    iconAnchor: [24, 30],//x,y
    shadowSize: [41, 41]
});


const mapStateToProps = (state) => {
    return {
        isLoading: state.LoadingReducer.isLoading,
        currentTyleLayer: state.MapTyleLayerReducer.currentTyleLayer,
        lineColor: state.MapTyleLayerReducer.lineColor,
        cloudletIconColor: state.MapTyleLayerReducer.cloudletIconColor,
    }
};
const mapDispatchProps = (dispatch) => {
    return {
        toggleLoading: (data) => {
            dispatch(actions.toggleLoading(data))
        },
        setMapTyleLayer: (data) => {
            dispatch(actions.setMapTyleLayer(data))
        },

        setLineColor: (data) => {
            dispatch(actions.setLineColor(data))
        },

        setCloudletIconColor: (data) => {
            dispatch(actions.setCloudletIconColor(data))
        },
    };
};
type Props = {
    parent: PageDevMonitoring,
    markerList: Array,
    selectedClientLocationListOnAppInst: any,
    isMapUpdate: boolean,
    currentWidgetWidth: number,
    isFullScreenMap: boolean,
    currentTyleLayer: string,
    lineColor: string,
    cloudletIconColor: string,
    setMapTyleLayer: Function,
    setLineColor: Function,
    setCloudletIconColor: Function,
    isLoading: boolean,

};
type State = {
    zoom: number,
    popUploading: boolean,
    newCloudLetLocationList: Array,
    isUpdateEnable: boolean,
    clientList: any,
    currentTyleLayer: any,
    currentWidgetWidth: number,
    clientObjKeys: any,
    lineColor: string,
    cloudIcon: string,
    cloudletIconColor: string,

};

export default connect(mapStateToProps, mapDispatchProps)(
    class LeafletMapContainerDev extends React.Component<Props, State> {
        mapTileList = [
            {
                url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                name: 'dark1',
            },
            {
                url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
                name: 'dark2',
            },

            {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
                name: 'white1',
            },
            {
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                name: 'white2',
            },

        ]


        constructor(props: Props) {
            super(props);

            this.state = {
                zoom: 3,//mapZoom
                appInstanceListGroupByCloudlet: '',
                cloudletKeys: [],
                newCloudLetLocationList: [],
                showModal: false,
                showOffice: false,
                isUpdateEnable: false,
                arrIsShowCloudlet: [],
                reDrawMap: 'dummy',
                viewport: DEFAULT_VIEWPORT,
                markers: [
                    {key: 'marker1', position: [51.5, -0.1], content: 'My first popup'},
                    {key: 'marker2', position: [51.51, -0.1], content: 'My second popup'},
                    {key: 'marker3', position: [51.49, -0.05], content: 'My third popup'},
                ],
                popupLoading: false,
                clientList: [],
                currentTyleLayer: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                currentWidgetWidth: window.innerWidth / 3,
                clientObjKeys: [],
                lineColor: 'yellow',
                cloudletIconColor: 'green',

            };


        }

        componentDidMount = async () => {
            console.log('componentDidMount===>', this.props.markerList);
            let appInstanceListGroupByCloudlet = this.props.markerList
            this.setCloudletLocation(appInstanceListGroupByCloudlet)
        };


        async componentWillReceiveProps(nextProps: Props, nextContext: any): void {

            if (this.props.markerList !== nextProps.markerList) {
                console.log('markerList2222 nextProps_markerList===>', nextProps.markerList);
                let appInstanceListGroupByCloudlet = nextProps.markerList;
                this.setCloudletLocation(appInstanceListGroupByCloudlet)
            }

            //@desc : #############################
            //@desc : clientList
            //@desc : #############################
            if (this.props.selectedClientLocationListOnAppInst !== nextProps.selectedClientLocationListOnAppInst) {

                await this.setState({
                    clientObjKeys: [],
                })
                console.log("selectedClientLocationListOnAppInst==nextProps==>", nextProps.selectedClientLocationListOnAppInst);

                let clientList = nextProps.selectedClientLocationListOnAppInst;

                console.log("clientList===length=>", clientList.length);
                //desc: duplication remove by client cellphone uuid
                clientList = removeDuplicates(clientList, "uuid")

                let newClientList = []
                clientList.map((item: TypeClient, index) => {
                    let clientLocation = parseFloat(item.latitude).toFixed(3).toString() + parseFloat(item.longitude).toFixed(2).toString();
                    console.log("clientLocation====>", clientLocation);
                    item.clientLocation = clientLocation;
                    newClientList.push(item);
                })

                let groupedClientList = groupByKey_(newClientList, 'clientLocation')
                let clientObjKeys = Object.keys(groupedClientList)
                await this.setState({
                    clientList: groupedClientList,
                    clientObjKeys: clientObjKeys,
                }, () => {
                    console.log("selectedClientLocationListOnAppInst====>", this.state.clientList);
                })
            }

        }

        setCloudletLocation(pAppInstanceListGroupByCloudlet) {
            let cloudletKeys = Object.keys(pAppInstanceListGroupByCloudlet)

            let newCloudLetLocationList = []
            cloudletKeys.map((key, index) => {

                let AppNames = ''
                let CloudletLocation = '';
                let Cloudlet = '';
                let ClusterInst = '';
                pAppInstanceListGroupByCloudlet[key].map((innerItem: TypeAppInstance, index) => {

                    console.log("setCloudletLocation====>", innerItem);

                    if (index === (pAppInstanceListGroupByCloudlet[key].length - 1)) {
                        AppNames += innerItem.AppName + " | " + innerItem.ClusterInst + " | " + innerItem.Region + " | " + innerItem.HealthCheck + " | " + innerItem.Version + " | " + innerItem.Operator
                    } else {
                        AppNames += innerItem.AppName + " | " + innerItem.ClusterInst + " | " + innerItem.Region + " | " + innerItem.HealthCheck + " | " + innerItem.Version + " | " + innerItem.Operator + " , "
                    }
                    console.log("Operator===>", innerItem.Operator);

                    CloudletLocation = innerItem.CloudletLocation;
                    Cloudlet = innerItem.Cloudlet;

                })

                console.log("setCloudletLocation===>", AppNames);

                newCloudLetLocationList.push({
                    AppNames: AppNames,
                    CloudletLocation: CloudletLocation,
                    Cloudlet: Cloudlet,
                    isShow: false,
                    isShowCircle: false,
                    //ClusterInst: ClusterInst,
                })

            })

            let arrIsShowCloudlet = []

            //@todo: cloudletDIV block, hidden
            newCloudLetLocationList.map(item => {
                arrIsShowCloudlet.push(false);
            })


            console.log('arrIsShowCloudlet===>', arrIsShowCloudlet);


            this.setState({
                newCloudLetLocationList: newCloudLetLocationList,
                arrIsShowCloudlet: arrIsShowCloudlet,
                appInstanceListGroupByCloudlet: pAppInstanceListGroupByCloudlet,
            }, () => {
                console.log('newCloudLetLocationList===>', this.state.newCloudLetLocationList);
            })


        }


        render() {

            return (
                <React.Fragment>
                    <div>
                        {!this.props.isFullScreenMap &&
                        <div className='page_monitoring_title_area'>
                            <div style={{
                                display: 'flex',
                                width: '100%',
                                height: 30
                            }}>
                                <div className='page_monitoring_title' style={{
                                    backgroundColor: 'transparent',
                                    flex: .38
                                }}>
                                    Deployed Instance
                                </div>

                            </div>
                        </div>
                        }

                        {this.props.parent.state.mapPopUploading &&
                        <div className='page_monitoring_title_area'>
                            <div className='page_monitoring_title' style={{
                                backgroundColor: 'transparent',
                                flex: .65
                            }}>
                                <div style={{zIndex: 99999999999}}>
                                    <CircularProgress style={{
                                        color: '#1cecff',
                                        marginRight: 0,
                                        marginBottom: -2,
                                        fontWeight: 'bold',
                                    }}
                                                      size={14}/>
                                </div>
                            </div>
                        </div>
                        }

                    </div>
                    <div className='page_monitoring_container'>
                        <div style={{height: '100%', width: '100%', zIndex: 1}}>
                            <Map center={[45.4, 51.7]}
                                 duration={0.9}
                                 zoom={this.state.zoom}
                                 onZoomEnd={(e) => {
                                     this.setState({
                                         zoom: e.target._zoom,
                                     })
                                 }}
                                 style={{width: '100%', height: '100%', zIndex: 1,}}
                                 easeLinearity={1}
                                 useFlyTo={true}
                                 dragging={true}
                                 boundsOptions={{padding: [50, 50]}}
                                 maxZoom={15}
                                 onResize={() => {

                                 }}
                                 ref={(ref) => {
                                     this.map = ref;
                                 }}
                            >
                                {this.props.isLoading && renderPlaceHolderLottiePinJump3()}
                                <TileLayer
                                    url={this.props.currentTyleLayer}
                                    //url={'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'}
                                    minZoom={2}
                                    style={{zIndex: 1}}
                                    //maxZoom={15}
                                />
                                {this.state.newCloudLetLocationList.length === 0 &&
                                <Rectangle
                                    bounds={[[50.1109, 5.6821], [37.5665, 95.978],]}

                                    color={'green'}
                                    attribution={{
                                        weight: 10,

                                    }}
                                >

                                    <Tooltip
                                        //offset={[14, -10]}//x,y
                                        className='tooltip001'
                                        opacity={0.8}
                                        permanent
                                        direction={'center'}
                                        style={{
                                            cursor: 'pointer',
                                            pointerEvents: 'auto',
                                            fontSize: 15,
                                            background: 'green',
                                        }}

                                    >
                                        <span>
                                            There are no apps on the selected cluster | cloud
                                        </span>
                                    </Tooltip>
                                </Rectangle>
                                }


                                <Control position="topleft">
                                    <Icon
                                        onClick={() => {
                                            this.setState({
                                                zoom: 3,
                                            })
                                        }}
                                        name='redo'
                                        style={{
                                            color: 'black',
                                            fontSize: 18,
                                            borderRadius: 3,
                                            backgroundColor: 'white',
                                            height: 26,
                                            width: 27,
                                            cursor: 'pointer'
                                        }}/>
                                </Control>
                                {/*@desc:#####################################..*/}
                                {/*@desc: topRight Radio Btns changing MapTyle...*/}
                                {/*@desc:#####################################..*/}
                                {this.props.isFullScreenMap &&
                                <div style={{position: 'absolute', top: 5, right: 5, zIndex: 99999}}>
                                    <Radio.Group defaultValue="0" buttonStyle="solid"
                                                 onChange={async (e) => {
                                                     let index = e.target.value

                                                     let lineColor = DARK_LINE_COLOR;
                                                     let cloudletIconColor = DARK_CLOUTLET_ICON_COLOR
                                                     if (Number(index) >= 2) {
                                                         lineColor = WHITE_LINE_COLOR;
                                                         cloudletIconColor = WHITE_CLOUTLET_ICON_COLOR
                                                     }

                                                     this.props.setMapTyleLayer(this.mapTileList[index].url);
                                                     this.props.setLineColor(lineColor);
                                                     this.props.setCloudletIconColor(cloudletIconColor);

                                                 }}
                                    >
                                        <Radio.Button defaultChecked={true} value="0">Dark1</Radio.Button>
                                        <Radio.Button value="1">Dark2</Radio.Button>
                                        <Radio.Button value="2">White1</Radio.Button>
                                        <Radio.Button value="3">White2</Radio.Button>
                                    </Radio.Group>
                                </div>
                                }


                                {/*@desc:#####################################..*/}
                                {/*@desc:client Markers                      ...*/}
                                {/*@desc:#####################################..*/}
                                {this.state.clientObjKeys.map((objkeyOne, index) => {
                                    let groupedClientList = this.state.clientList;

                                    return (
                                        <MarkerClusterGroup>
                                            {groupedClientList[objkeyOne].map((item, index) => {
                                                console.log("groupedClientList====>", item)

                                                return (
                                                    <React.Fragment>
                                                        <Marker
                                                            icon={cellphoneIcon2}
                                                            position={
                                                                [item.latitude, item.longitude]
                                                            }
                                                        >
                                                            <Popup className='clientPopup'
                                                                   style={{fontSize: 11}}>{item.uuid}</Popup>
                                                        </Marker>
                                                        {/*@desc:#####################################..*/}
                                                        {/*@desc:Render lines....                       */}
                                                        {/*@desc:#####################################..*/}
                                                        <Polyline
                                                            dashArray={['3,5,8']}
                                                            id={index}
                                                            positions={[
                                                                [item.latitude, item.longitude], [item.serverLocInfo.lat, item.serverLocInfo.long],
                                                            ]}
                                                            color={this.props.lineColor}
                                                        />

                                                    </React.Fragment>
                                                )

                                            })

                                            }
                                        </MarkerClusterGroup>
                                    )


                                })}


                                {/*@desc:#####################################..*/}
                                {/*@desc:cloudlet Markers                    ...*/}
                                {/*@desc:#####################################..*/}
                                {this.state.newCloudLetLocationList.map((outerItem, outerIndex) => {
                                    let listAppName = outerItem.AppNames.split(",")
                                    console.log("outerItem====>", outerItem);


                                    if (outerItem.CloudletLocation.latitude != undefined) {
                                        return (
                                            <Marker
                                                ref={c => this.marker1 = c}
                                                icon={this.props.cloudletIconColor === 'green' ? cloudGreenIcon : cloudBlueIcon}
                                                className='marker1'
                                                position={
                                                    [outerItem.CloudletLocation.latitude, outerItem.CloudletLocation.longitude,]
                                                }
                                                onClick={() => {

                                                    let toggleNewCloudletLocationList = this.state.newCloudLetLocationList;
                                                    toggleNewCloudletLocationList[outerIndex].isShowCircle = !toggleNewCloudletLocationList[outerIndex].isShowCircle
                                                    this.setState({
                                                        newCloudLetLocationList: toggleNewCloudletLocationList,
                                                        isUpdateEnable: true,
                                                    })

                                                    //this.props.handleSelectCloudletForMapkerClicked(item.CloudletName)
                                                }}
                                            >
                                                <Tooltip
                                                    direction='right'
                                                    offset={[14, -10]}//x,y
                                                    opacity={0.8}
                                                    permanent
                                                    ref={c => {
                                                        this.toolTip = c;
                                                    }}
                                                    style={{cursor: 'pointer', pointerEvents: 'auto'}}

                                                >

                                <span
                                    className='toolTip'
                                    style={{color: 'black'}}>{outerItem.Cloudlet}</span>
                                                </Tooltip>
                                                <Popup className='popup1'>

                                                    {listAppName.map(AppFullName => {

                                                        let AppName = AppFullName.trim().split(" | ")[0].trim()
                                                        let ClusterInst = AppFullName.trim().split(" | ")[1].trim()
                                                        let Region = AppFullName.trim().split(" | ")[2].trim()
                                                        let HealthCheck = AppFullName.trim().split(" | ")[3].trim()
                                                        let Version = AppFullName.trim().split(" | ")[4].trim()
                                                        let Operator = AppFullName.trim().split(" | ")[5].trim()

                                                        let lat = outerItem.CloudletLocation.latitude;
                                                        let long = outerItem.CloudletLocation.longitude;

                                                        let serverLocation = {
                                                            lat,
                                                            long,
                                                        }


                                                        return (
                                                            <div style={{
                                                                fontSize: 14, cursor: 'crosshair',

                                                                flexDirection: 'column',
                                                                marginTop: 5, marginBottom: 5
                                                            }}
                                                            >
                                                                <Ripples
                                                                    style={{marginLeft: 5}}
                                                                    color='#1cecff' during={500}
                                                                    onClick={() => {

                                                                        let dataSet = AppName + " | " + outerItem.Cloudlet.trim() + " | " + ClusterInst + " | " + Region + " | " + HealthCheck + " | " + Version + " | " + Operator + " | " + JSON.stringify(serverLocation);

                                                                        console.log("dataSet====>", dataSet)

                                                                        this.props.handleAppInstDropdown(dataSet)
                                                                    }}
                                                                >
                                                                    {AppName} [{Version}]
                                                                    <div style={{
                                                                        color: '#77BD25',
                                                                        fontSize: 12
                                                                    }}>
                                                                        &nbsp;&nbsp;{` [${ClusterInst.trim()}]`}
                                                                    </div>
                                                                    <div>

                                                                        {/*todo:HealthCheck value 3 is okay*/}
                                                                        {/*todo:HealthCheck value 3 is okay*/}
                                                                        {/*todo:HealthCheck value 3 is okay*/}
                                                                        {HealthCheck === 3 ?
                                                                            <div style={{
                                                                                marginLeft: 7,
                                                                                marginBottom: 0,
                                                                                height: 15,
                                                                            }}>
                                                                                <CheckCircleOutlined style={{
                                                                                    color: 'green',
                                                                                    fontSize: 17,
                                                                                    marginBottom: 25
                                                                                }}/>
                                                                            </div>
                                                                            :
                                                                            <div style={{
                                                                                marginLeft: 7,
                                                                                marginBottom: 0,
                                                                                height: 15,
                                                                            }}>
                                                                                <CheckCircleOutlined style={{
                                                                                    color: 'red',
                                                                                    fontSize: 17,
                                                                                    marginBottom: 25
                                                                                }}/>
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                </Ripples>
                                                            </div>
                                                        )
                                                    })}
                                                </Popup>
                                            </Marker>
                                        )
                                    }


                                })}
                            </Map>
                        </div>

                    </div>
                </React.Fragment>
            );
        }
    }
)
