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

export const fields = {
    empty:'empty',
    uuid: 'uuid',
    region: 'region',
    clusterName: 'clusterName',
    cloudlet_name_operator: 'cloudlet_name_operator',
    realclustername: 'realclustername',
    organizationName: 'organizationName',
    org: 'org',
    billingOrgName: 'billingOrgName',
    operatorName: 'operatorName',
    trustPolicyExceptionName:'trustPolicyExceptionName',
    partnerOperator: 'partnerOperator',
    cloudletName: 'cloudletName',
    flavorName: 'flavorName',
    gpuDriverName: 'gpuDriverName',
    ipAccess: 'ipAccess',
    forceupdate: 'forceupdate',
    nodeFlavor: 'nodeFlavor',
    buildName: 'buildName',
    driverPath: 'driverPath',
    md5Sum: 'md5Sum',
    numsamples: 'numsamples',
    flavorusage: 'flavorusage',
    driverPathCreds: 'driverPathCreds',
    operatingSystem: 'operatingSystem',
    kernelVersion: 'kernelVersion',
    hypervisorInfo: 'hypervisorInfo',
    numberOfMasters: 'numberOfMasters',
    numberOfNodes: 'numberOfNodes',
    sharedVolumeSize: 'sharedVolumeSize',
    autoClusterInstance: 'autoClusterInstance',
    state: 'state',
    status: 'status',
    reservable: 'reservable',
    reservedBy: 'reservedBy',
    resources: 'resources',
    organizationInfo: 'organizationInfo',
    deployment: 'deployment',
    cloudletLocation: 'cloudletLocation',
    latitude: 'latitude',
    longitude: 'longitude',
    ipSupport: 'ipSupport',
    numDynamicIPs: 'numDynamicIPs',
    physicalName: 'physicalName',
    platformType: 'platformType',
    vmPool: 'vmPool',
    type: 'type',
    firstName: 'firstName',
    lastName: 'lastName',
    name: 'name',
    alertThreshold: 'alertThreshold',
    resourceValue: 'resourceValue',
    resourceName: 'resourceName',
    address: 'address',
    phone: 'phone',
    country: 'country',
    city: 'city',
    postalCode: 'postalCode',
    children: 'children',
    trustPolicyName: 'trustPolicyName',
    outboundSecurityRules: 'outboundSecurityRules',
    outboundSecurityRuleMulti: 'outboundSecurityRuleMulti',
    protocol: 'protocol',
    portRangeMin: 'portRangeMin',
    portRangeMax: 'portRangeMax',
    remoteIP: 'remoteIP',
    remoteCIDR: 'remoteCIDR',
    autoPolicyName: 'autoPolicyName',
    deployClientCount: 'deployClientCount',
    deployIntervalCount: 'deployIntervalCount',
    undeployClientCount: 'undeployClientCount',
    undeployIntervalCount: 'undeployIntervalCount',
    cloudlets: 'cloudlets',
    organizations: 'organizations',
    appName: 'appName',
    autoClusterName:'autoClusterName',
    autoClusterNameGroup:'autoClusterNameGroup',
    app_name_version: 'appnameversion',
    version: 'version',
    uri: 'uri',
    liveness: 'liveness',
    mappedPorts: 'mappedPorts',
    map: "map",
    event: "event",
    client: "client",
    errors: 'errors',
    runtimeInfo: 'runtimeInfo',
    createdAt: 'createdAt',
    seconds: 'seconds',
    updatedAt: 'updatedAt',
    revision: 'revision',
    ram: 'ram',
    vCPUs: 'vCPUs',
    disk: 'disk',
    memory:'memory',
    sent: 'sent',
    received: 'received',
    network: 'networks',
    licenseConfig: 'licenseConfig',
    properties: 'properties',
    property: 'property',
    buildCount: 'buildCount',
    builds: 'builds',
    activeConnections:'activeConnections',
    build: 'build',
    gpu: 'gpu',
    notifyId: 'notifyId',
    controller: 'controller',
    osMaxRam: 'osMaxRam',
    osMaxVCores: 'osMaxVCores',
    osMaxVolGB: 'osMaxVolGB',
    flavors: 'flavors',
    command: 'command',
    deploymentManifest: 'deploymentManifest',
    imageType: 'imageType',
    imagePath: 'imagePath',
    defaultFlavorName: 'defaultFlavorName',
    defaultTrustPolicy: 'defaultTrustPolicy',
    ports: 'ports',
    authPublicKey: 'authPublicKey',
    scaleWithCluster: 'scaleWithCluster',
    officialFQDN: 'officialFQDN',
    androidPackageName: 'androidPackageName',
    deploymentGenerator: 'deploymentGenerator',
    accessPorts: 'accessPorts',
    accessType: 'accessType',
    username: 'username',
    startdate: 'statedate',
    nextDate: 'nextDate',
    timezone: 'timezone',
    password: 'password',
    currentPassword:'currentPassword',
    confirmPassword: 'confirmPassword',
    role: 'role',
    email: 'email',
    schedule: 'schedule',
    emailVerified: 'emailVerified',
    passHash: 'passHash',
    iter: 'iter',
    familyName: 'familyName',
    givenName: 'givenName',
    picture: 'picture',
    nickName: 'nickName',
    locked: 'locked',
    outboundSecurityRulesCount: 'outboundSecurityRulesCount',
    cloudletCount: 'cloudletCount',
    organizationCount: 'organizationCount',
    fullIsolation: 'fullIsolation',
    cloudletStatus: 'cloudletStatus',
    actions: 'actions',
    manage: 'manage',
    checkbox: 'checkbox',
    poolName: 'poolName',
    invite: 'invite',
    confirm: 'confirm',
    decision: 'decision',
    grant: 'grant',
    clusterinst: 'clusterinst',
    container_ids: 'container_ids',
    openRCData: 'openRCData',
    caCertdata: 'caCertdata',
    clusterdeveloper: 'clusterdeveloper',
    appDeveloper: 'appDeveloper',
    containerVersion: 'containerVersion',
    vmImageVersion: 'vmImageVersion',
    configs: 'configs',
    configmulti: 'configmulti',
    config: 'config',
    listFilter: 'listFilter',
    kind: 'kind',
    ocPortMin: 'ocPortMin',
    ocPortMax: 'ocPortMax',
    ocRemoteCIDR: 'ocRemoteCIDR',
    ocProtocol: 'ocProtocol',
    annotations: 'annotations',
    annotationmulti: 'annotationmulti',
    requiredOutboundConnections: 'requiredOutboundConnections',
    requiredOutboundConnectionmulti: 'requiredOutboundConnectionmulti',
    key: 'key',
    value: 'value',
    publicImages: 'publicImages',
    updateAvailable: 'updateAvailable',
    update: 'update',
    appInstances: 'appInstances',
    upgrade: 'upgrade',
    refreshAppInst: 'refreshAppInst',
    restagmap: 'restagmap',
    gpuConfig: 'gpuConfig',
    gpuExist: 'gpuExist',
    gpuORG: 'gpuORG',
    powerState: 'powerState',
    tls: 'tls',
    edgeboxOnly: 'edgeboxOnly',
    userList: 'userList',
    infraApiAccess: 'infraApiAccess',
    infraFlavorName: 'infraFlavorName',
    infraExternalNetworkName: 'infraExternalNetworkName',
    maintenanceState: 'maintenanceState',
    manifest: 'manifest',
    userRole: 'userRole',
    healthCheck: 'healthCheck',
    skipHCPorts: 'skipHCPorts',
    templateDelimiter: 'templateDelimiter',
    autoScalePolicyName: 'autoScalePolicyName',
    minimumNodes: 'minimumNodes',
    maximumNodes: 'maximumNodes',
    scaleUpCPUThreshold: 'scaleUpCPUThreshold',
    scaleDownCPUThreshold: 'scaleDownCPUThreshold',
    targetActiveConnections: 'targetActiveConnections',
    stabilizationWindowSec: 'stabilizationWindowSec',
    targetCPU: 'targetCPU',
    targetMEM: 'targetMEM',
    minActiveInstances: 'minActiveInstances',
    maxInstances: 'maxInstances',
    fields: 'fields',
    envVars: 'envVars',
    envVar: 'envVar',
    apps: 'apps',
    eventType: 'eventType',
    resourceQuotas: 'resourceQuotas',
    cpu: 'cpu',
    mem:'mem',
    resourceQuota: 'resourceQuota',
    defaultResourceAlertThreshold: 'defaultResourceAlertThreshold',
    time: 'time',
    starttime: 'starttime',
    endtime: 'endtime',
    selector: 'selector',
    isAdmin: 'isAdmin',
    metric: 'metric',
    location: 'location',
    values: 'values',
    columns: 'columns',
    labels: 'labels',
    job: 'job',
    instance: 'instance',
    activeAt: 'activeAt',
    alertname: 'alertname',
    envoyclustername: 'envoyclustername',
    slackchannel: 'slackchannel',
    pagerDutyIntegrationKey: 'pagerDutyIntegrationKey',
    pagerDutyApiVersion: 'pagerDutyApiVersion',
    slackwebhook: 'slackwebhook',
    severity: 'severity',
    triggerTime: 'triggerTime',
    cpuUtilizationLimit: 'cpuUtilizationLimit',
    memUtilizationLimit: 'memUtilizationLimit',
    diskUtilizationLimit: 'diskUtilizationLimit',
    activeConnectionLimit: 'activeConnectionLimit',
    slack: 'slack',
    pagerDuty: 'pagerDuty',
    appCloudlet: 'appCloudlet',
    appOperator: 'appOperator',
    receiverAddress: 'receiverAddress',
    otp: 'otp',
    port: 'port',
    appRevision: 'appRevision',
    autoProvPolicies: 'autoProvPolicies',
    alertPolicies: 'alertPolicies',
    title: 'title',
    description: 'description',
    trusted: 'trusted',
    federation: 'federation',
    compatibilityVersion: 'compatibilityVersion',
    kafkaCluster: 'kafkaCluster',
    kafkaUser: 'kafkaUser',
    kafkaPassword: 'kafkaPassword',
    vmappostype: 'vmappostype',
    locationtile: 'locationtile',
    _0s: '0s',
    _5ms: '5ms',
    _10ms: '10ms',
    _25ms: '25ms',
    _50ms: '50ms',
    _100ms: '100ms',
    color: 'color',
    networkType: 'networkType',
    deviceCarrier: 'deviceCarrier',
    isPrivate: 'isPrivate',
    alertPolicyName: 'alertPolicyName',
    allianceOrganization: 'allianceOrganization',
    networkName: 'networkName',
    routes: 'routes',
    connectionType: 'connectionType',
    allowServerless: 'allowServerless',
    serverlessConfig: 'serverlessConfig',
    serverlessMinReplicas: 'serverlessMinReplicas',
    serverlessVcpu: 'serverlessVcpu',
    serverlessRam: 'serverlessRam',
    accessServerlessConfig: 'accessServerlessConfig',
    destinationCidr: 'destination_cidr',
    nextHopIp: 'next_hop_ip',
    accessRoutes: 'accessRoutes',
    qosSessionProfile: 'qosSessionProfile',
    qosSessionDuration: 'qosSessionDuration',
    countryCode: 'countryCode',
    mncs: 'mncs',
    code: 'code',
    mnc: 'mnc',
    mcc: 'mcc',
    locatorendpoint: 'locatorEndPoint',
    federationId: 'federationId',
    apiKey: 'apiKey',
    partnerOperatorName: 'partnerOperator',
    partnerFederationId: 'partnerFederationId',
    partnerFederationName: 'partnerFederationName',
    partnerCountryCode: 'partnerCountryCode',
    partnerFederationAddr: 'partnerFederationAddr',
    partnerAPIKey: 'partnerAPIKey',
    federationAddr: 'federationAddr',
    cloudletCount: 'cloudletCount',
    zoneId: 'zoneid',
    state: 'state',
    city: 'city',
    zoneLocation: 'zoneLocation',
    locality: 'locality',
    zonesList: 'zonesList',
    zonesShared: 'zonesShared',
    zonesReceived: 'zonesReceived',
    sharedCount: 'sharedCount',
    register: 'register',
    partnerRoleShareZoneWithSelf: 'partnerRoleShareZonesWithSelf',
    partnerRoleAccessToSelfZones: 'partnerRoleAccessToSelfZones',
    selfFederationId: 'selffederationid',
    selfOperatorId: 'selfoperatorid',
    registered: 'registered',
    zoneCount: 'zoneCount',
    sharedOperator: 'sharedOperator',
    autoGenerateFederationID: 'autoGenerateFederationID',
    zones: 'zones',
    mncmulti: 'mncmulti',
    dedicatedIp: 'dedicatedIp',
    singleK8sClusterOwner: 'singleK8sClusterOwner',
    networkSent: 'networkSent',
    networkReceived: 'networkReceived',
    cpuUsed: 'cpuUsed',
    memUsed: 'memUsed',
    diskUsed: 'diskUsed',
    externalIpsUsed:'externalIpsUsed',
    floatingIpsUsed: 'floatingIpsUsed',
    gpusUsed:'gpusUsed',
    ipv4Used: 'ipv4Used',
    instancesUsed:'instancesUsed',
    ramUsed:'ramUsed',
    count:'count',
    platformHighAvailability: 'platformHighAvailability'
}