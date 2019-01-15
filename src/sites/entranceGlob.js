import React, {Component} from 'react';
import axios from 'axios';
import { Grid, Button, Container } from 'semantic-ui-react';
import React3DGlobe from '../libs/react3dglobe';

import { connect } from 'react-redux';
import * as actions from '../actions';

import SiteOne from './siteOne';

class EntranceGlobe extends Component {

    constructor() {
        super();

        this.state = {
            data: null,
            intro:true
        };
    }

    componentDidMount() {
        axios.get('../data/sampleData.json')
            .then(response => this.setState({data: response.data}))
    }

    //go to NEXT
    goToNext(site) {
        //브라우져 입력창에 주소 기록
        let mainPath = site;
        let subPath = 'pg=0';
        this.props.history.push({
            pathname: mainPath,
            search: subPath,
            state: { some: 'state' }
        });
        this.props.history.location.search = subPath;
        this.props.handleChangeSite({mainPath:mainPath, subPath: subPath})

    }

    render() {

        return (

            // add data to "data" attribute, and render <Gio> tag

                (this.state.intro)?
                    <div style={{width:'100%', height:'100%', overflow:'hidden'}}>
                        <React3DGlobe/>
                        <div className='intro_logo' />
                        <div className='intro_link'>
                            <Button onClick={() => this.goToNext('/site2')}>MobiledgeX Monitoring</Button>
                            <Button onClick={() => this.goToNext('/site4')}>MobiledgeX Compute</Button>
                        </div>
                    </div>
                    :
                    <div style={{width:'100%', height:'100%'}}>
                        <SiteOne />
                    </div>



        )
    }
}

const mapDispatchProps = (dispatch) => {
    return {
        handleChangeSite: (data) => { dispatch(actions.changeSite(data))},
        handleChangeTab: (data) => { dispatch(actions.changeTab(data))}
    };
};

export default connect(null, mapDispatchProps)(EntranceGlobe);