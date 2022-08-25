import { LicenseManager, ResourceManager } from 'awesdk'
import { NetWorkHelper } from './NetworkHelper'
import { FileHelper } from './FileHelper'
import * as CryptoJS from "crypto-js";

const Config = {
    cachePath: `/idbfs/cache`,
    resourcePath: `/idbfs/resource`,
    domain: `http://img.metaworks.cn`
}

const addressPrefix = `${Config.cachePath}/human`;

const getFileNameNoPrefix = (filepath) => {
    let array = filepath.split("/");
    return array[array.length - 1];
}

export class ResourceHelper {
    mInstance = null
    licenseManager = null

    constructor(context) {
        if (context == null)
            throw new Error(`ResourceHelper context is invalid!`);
        this.initResourceDirectory(context);
        this.licenseManager = LicenseManager.getInstance(context);
        this.context = context;
    }

    static getInstance(context) {
        if (this.mInstance == null)
            this.mInstance = new ResourceHelper(context);
        return this.mInstance;
    }

    static resetInstance() {
        this.mInstance = null
    }

    initResourceDirectory(context) {
        ResourceManager.getInstance(context).setCacheDirectory(Config.cachePath);
        ResourceManager.getInstance(context).addResourceDirectory(Config.resourcePath);
    }

    getLicenseAuth() {
        return this.licenseManager.genAuthString();
    }

    parseHumanBaseInfo(url) {
        return addressPrefix + getFileNameNoPrefix(url)
    }

    getBaseInfoKey(faceUrl, mode = "key") {
        const match = faceUrl.match(/(\w+)\.\w+(\?\w+)?$/);
        if (match) {
            if (mode == "key") {
                return match[1];
            } else if (mode == "path") {
                return match[0];
            }
        }
        return "";
    }

    loadHumanResource(info) {
        const resources = {};
        const { targetUrl, mappingUrl, headUrl, bodyUrl } = info

        resources[targetUrl] = addressPrefix + getFileNameNoPrefix(targetUrl);
        resources[mappingUrl] = addressPrefix + getFileNameNoPrefix(mappingUrl);

        const mappingKey = this.getBaseInfoKey(mappingUrl);
        if (headUrl) {
            resources[headUrl] = addressPrefix + mappingKey + "_head.png";
        }

        if (bodyUrl) {
            resources[bodyUrl] = addressPrefix + mappingKey + "_upbody.png";
        }

        return this.fetchResourceIfCached(resources)
    }

    loadAnimations(names) {
        return this.downloadStaticResource(names);
    }

    loadOutfits(names) {
        return this.downloadStaticResource(names);
    }

    downloadStaticResource(names) {
        const resources = {}
        names.map(value => {
            const resKey = `${Config.domain}/webgl/app/${value}?123`;
            const resPath = `${Config.cachePath}/${value}.zip`
            resources[resKey] = resPath
        });
        return this.fetchResourceIfCached(resources);
    }

    downloadURLResource(names) {
        const resources = {}
        names.map(value => {
            const resKey = value;
            const resPath = resKey.split('/').slice(-1)[0]
            resources[resKey] = resPath
        });

        return this.fetchResourceIfCached(resources);
    }

    async downloadTTSResource(params) {
        const { text, tts_args, audio_type, audio, expression_anim, teeth_anim } = params;

        const id = CryptoJS.enc.Hex.stringify(
            CryptoJS.MD5(`${text}${tts_args}${audio_type}`)
        );
        const audioUrl = audio
        const audioPath = `${Config.resourcePath}/${id}.wav`;
        const expressionUrl = expression_anim;
        const expressionPath = `${Config.cachePath}/${id}_expression.anim`;
        const teethUrl = teeth_anim;
        const teethPath = `${Config.cachePath}/${id}_teeth.anim`;
        const ttsResources = {};
        ttsResources[audioUrl] = audioPath;
        ttsResources[expressionUrl] = expressionPath;
        ttsResources[teethUrl] = teethPath;
        console.error("ttsResource", ttsResources);

        const result = await this.fetchResourceIfCached(ttsResources);
        return Promise.resolve(result ? id : false);
    }

    fetchResourceIfCached(resources) {
        for (let i in resources) {
            if (FileHelper.isExist(resources[i])) {
                resources[i] = undefined
            }
        }

        if (JSON.stringify(resources) === '{}') {
            return true;
        }

        return NetWorkHelper.DownloadFiles(resources)
    }
}