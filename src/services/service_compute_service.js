
import axios from 'axios-jsonp-pro';

import request from 'request';

import FormatComputeDev from './formatter/formatComputeDeveloper';
import FormatComputeCloudlet from './formatter/formatComputeCloudlet';
import FormatComputeApp from './formatter/formatComputeApp';
import FormatComputeOper from './formatter/formatComputeOperator';
import FormatComputeInst from './formatter/formatComputeInstance';


export function getOperator(resource, callback) {
    fetch('http://localhost:3030')
        .then(response => response.json())
        .then(data => {
            console.log('infux data == ', data)

        });

}

//curl -X POST "https://mexdemo.ctrl.mobiledgex.net:36001/show/cloudlet" -H "accept: application/json" -H "Content-Type: application/json" --cacert mex-ca.crt --key mex-client.key --cert mex-client.crt
export function getDevelopersInfo(resource, callback) {
    axios.get('/dummyData/db_developer.json')
        .then(function (response) {
            callback(FormatComputeDev(response))
        })
        .catch(function (error) {
            console.log(error);
        });
}
export function getCloudletInfo(resource, callback) {
    axios.get('/dummyData/db_cloudlet.json')
        .then(function (response) {
            callback(FormatComputeCloudlet(response))
        })
        .catch(function (error) {
            console.log(error);
        });
}
export function getAppInfo(resource, callback) {
    axios.get('/dummyData/db_app.json')
        .then(function (response) {
            console.log('response  -',response);
            callback(FormatComputeApp(response))
        })
        .catch(function (error) {
            console.log(error);
        });
}
export function getOperatorInfo(resource, callback) {
    axios.get('/dummyData/db_operator.json')
        .then(function (response) {
            console.log('response  -',response);
            callback(FormatComputeOper(response))
        })
        .catch(function (error) {
            console.log(error);
        });
}
export function getComputeService(resource, callback) {
    axios.get('http://localhost:3030/compute?service='+resource)
        .then(function (response) {
            let paseData = JSON.parse(JSON.stringify(response.data));
            let splitData = JSON.parse( "["+paseData.split('}\n{').join('},\n{')+"]" );
            console.log('response paseData  -',splitData );
            switch(resource){
                case 'flavors': callback(FormatComputeInst(splitData)); break;
                case 'cluster': callback(FormatComputeInst(splitData)); break;
                case 'operator': callback(FormatComputeOper(splitData)); break;
                case 'developer': callback(FormatComputeDev(splitData)); break;
                case 'cloudlet': callback(FormatComputeCloudlet(splitData)); break;
                case 'app': callback(FormatComputeApp(splitData)); break;
                case 'appinst': callback(FormatComputeInst(splitData)); break;
            }
        })
        .catch(function (error) {
            console.log(error);
        });

}
