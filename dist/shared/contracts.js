/**
 * Application ports injected into feature adapters. Domain functions stay pure.
 * @typedef {Object} FeatureContext
 * @property {()=>object} campaign
 * @property {()=>object} state
 * @property {(description:string, mutate:Function, options?:object)=>Promise<void>} commit
 * @property {object} ui
 * @property {(id:string)=>object|undefined} service Optional public feature API.
 * @property {(id:string)=>void} activateCampaign
 * @property {Function} render
 * @property {Function} formDialog
 * @property {Function} readDialog
 * @property {Function} closeDialog
 * @property {Function} value
 * @property {Function} toast
 * @property {Function} report
 * @property {Function} route
 * @property {Function} removeCharacter
 */
export {};
