import { requestGoogleJson, createServiceAccountTokenProvider } from '../google/google-workspace.mjs';
const WRITE_SCOPE=['https://www.googleapis.com/auth/spreadsheets'];
export const createIngestionTokenProvider=({env=process.env,fetchImpl=globalThis.fetch,logger}={})=>{
  if(env.SUBSOLO_GOOGLE_SHEETS_WRITE_ACCESS_TOKEN?.trim())return{async getToken(){return env.SUBSOLO_GOOGLE_SHEETS_WRITE_ACCESS_TOKEN.trim();}};
  return createServiceAccountTokenProvider({credentialPath:env.SUBSOLO_GOOGLE_SERVICE_ACCOUNT_FILE||env.GOOGLE_APPLICATION_CREDENTIALS,scopes:WRITE_SCOPE,fetchImpl,logger});
};
export const createGoogleSheetsPitchRepository=({spreadsheetId,range='PAUTAS!A:AZ',headers,tokenProvider,fetchImpl=globalThis.fetch,timeoutMs=10000,maxAttempts=3,logger})=>{
  if(!spreadsheetId)throw new Error('spreadsheetId obrigatório');if(!Array.isArray(headers)||!headers.length)throw new Error('headers obrigatórios');
  const encodedId=encodeURIComponent(spreadsheetId);const encodedRange=encodeURIComponent(range);
  return{async list(){const {data}=await requestGoogleJson({url:`https://sheets.googleapis.com/v4/spreadsheets/${encodedId}/values/${encodedRange}?majorDimension=ROWS`,tokenProvider,fetchImpl,timeoutMs,maxAttempts,logger});const rows=data.values??[];const actual=rows[0]??headers;return rows.slice(1).map(row=>Object.fromEntries(actual.map((key,i)=>[key,row[i]??''])));},async insert(pitch){const values=headers.map(key=>{const value=pitch[key];return value==null?'':typeof value==='object'?JSON.stringify(value):value;});const url=`https://sheets.googleapis.com/v4/spreadsheets/${encodedId}/values/${encodedRange}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&includeValuesInResponse=false`;const {data}=await requestGoogleJson({url,method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({majorDimension:'ROWS',values:[values]}),tokenProvider,fetchImpl,timeoutMs,maxAttempts,logger});return{inserted:true,updated_range:data?.updates?.updatedRange??null,pauta_id:pitch.pauta_id};}};
};
