import { fields } from "../../model/format"
import { primaryKeys as cloudletKeys } from "../../modules/cloudlet/primary"

const initialize = (parent, field, value) => {
  if (value) {
    parent = parent ? parent : {}
    parent[field] = value
  }
  return parent
}

export const APP_CLOUDLET_CLUSTER = 0
export const APP_CLOUDLET = 1
export const APP_CLUSTER = 2
export const CLOUDLET_CLUSTER = 3
export const CLOUDLET = 4
export const CLUSTER = 5
export const APP = 6

export const primaryKeys = (data, include) => {

  let appKey = undefined
  appKey = initialize(appKey, 'organization', data[fields.organizationName])
  appKey = initialize(appKey, 'name', data[fields.appName])
  appKey = initialize(appKey, 'version', data[fields.version])


  let clusterInstKey = undefined
  if (include === APP_CLOUDLET_CLUSTER || include === APP_CLOUDLET) {
    clusterInstKey = initialize(clusterInstKey, 'cloudlet_key', cloudletKeys(data))
  }

  if (include === APP_CLOUDLET_CLUSTER || include === APP_CLUSTER) {
    let clusterKey = undefined
    clusterKey = initialize(clusterKey, 'name', data[fields.clusterName])
    clusterInstKey = initialize(clusterInstKey, 'cluster_key', clusterKey)
    clusterInstKey = initialize(clusterInstKey, 'organization', data[fields.clusterdeveloper])
  }

  let appInstKey = undefined
  if (clusterInstKey) {
    appInstKey = initialize(appInstKey, 'cluster_inst_key', clusterInstKey)
  }

  appInstKey = initialize(appInstKey, 'app_key', appKey)

  return appInstKey
}