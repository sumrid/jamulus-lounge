export const JAMULUS_CLIENT_NAME =
  process.env.JAMULUS_CLIENT_NAME || 'jamulus-client'
export const GOJAM_API_PORT = process.env.GOJAM_API_PORT || 9999
export const LOUNGE_SERVER_PORT = process.env.LOUNGE_SERVER_PORT || 9998
export const LOUNGE_CLIPPER_PORT = process.env.LOUNGE_CLIPPER_PORT || 9997
export const LOUNGE_ADMIN_PORT = process.env.LOUNGE_ADMIN_PORT || 9996

export const CLIPPER_UPLOAD_URL = process.env.CLIPPER_UPLOAD_URL
export const CLIPPER_UPLOAD_KEY = process.env.CLIPPER_UPLOAD_KEY
export const CLIPPER_DIR = process.env.CLIPPER_DIR || 'clipper'
export const CLIPPER_UPLOAD_NAMESPACE =
  process.env.CLIPPER_UPLOAD_NAMESPACE || 'clips'

export const TAVILY_API_KEY = process.env.TAVILY_API_KEY

export const STORAGE_ENDPOINT = process.env.STORAGE_ENDPOINT || 'localhost'
export const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'jamulus'
export const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL
export const STORAGE_AK = process.env.STORAGE_AK
export const STORAGE_SK = process.env.STORAGE_SK
export const STORAGE_REGION = process.env.STORAGE_REGION
export const UPLOAD_SERVER_PORT = +process.env.UPLOAD_SERVER_PORT || 10847
