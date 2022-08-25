import { BaseInfo, Gender, Human, LicenseManager } from "awesdk";
import { Color, Vector3 } from "awesdk-core";
import { NetWorkHelper } from "./NetworkHelper";
import { ResourceHelper } from "./ResourceHelper";

export class HumanHelper {
    mInstance = null;
    mHuman = null;
    mFaceTarget = '';
    mFaceMapping = '';
    mGender = null;

    constructor(context) {
        if (context == null)
            throw new Error(`HumanHelper context is invalid!`);
        this.context = context;
    }

    static getInstance(context) {
        if (this.mInstance == null)
            this.mInstance = new HumanHelper(context);
        return this.mInstance;
    }

    /**
     * 根据数字人id，创建人物
     * @param {string} id 数字人id
     * @returns {object} human：创建的人物对象
     */
    async createHumanById(id) {
        const humanInfo = await this.getHumanInfo(id);
        if (humanInfo == null) return;

        //  创建人物
        const human = new Human(this.context, humanInfo.info);
        this.human = human;

        //  更新人物属性
        this.refreshHuman(humanInfo.data);

        return human;
    }

    /**
     * 根据数字人id，获取数字人数据
     * @param {string} id 数字人id
     * @returns {{info, data}} info: BaseInfo对象，data：数字人数据
     */
    async getHumanInfo(id) {
        const ret = await this.requestHumanInfo(id);
        if (ret == null || ret == undefined || ret == '') {
            alert('找不到id对应的数字人！');
            return;
        }

        const targetUrl = ret.user_base.facial_target_url;
        const mappingUrl = ret.user_base.facial_mapping_url;
        const headUrl = ret.user_skin.skin_head;
        const bodyUrl = ret.user_skin.skin_body;
        let isSucceed = await ResourceHelper.getInstance(this.context).loadHumanResource({ targetUrl, mappingUrl, headUrl, bodyUrl });
        if (!isSucceed) return;

        const faceTarget = ResourceHelper.getInstance(this.context).parseHumanBaseInfo(targetUrl);
        const faceMapping = ResourceHelper.getInstance(this.context).parseHumanBaseInfo(mappingUrl);
        const gender = ret.user_base.gender == 0 ? Gender.Male : Gender.Female;

        const humanInfo = new BaseInfo();
        humanInfo.gender = gender
        humanInfo.faceTarget = faceTarget;
        humanInfo.faceMapping = faceMapping;
        return { info: humanInfo, data: ret };
    }

    async requestHumanInfo(id) {
        if (!this.isValidId(id)) return;
        const token = LicenseManager.getInstance(this.context).genAuthString();
        if (token == null || token == undefined || token == '') return;

        const url = `https://open.metamaker.cn/api/openmm/v1/user_anchor_info`;
        const result = await NetWorkHelper.Request(`${url}/${id}`, null, token);
        console.log('HumanHelper request human info :', result);
        const errCode = result.err_code;
        if (errCode == 0) {
            return result.ret;
        }
    }

    /**
     * 根据数字人id，刷新当前人物
     * @param {string} id 数字人id
     * @returns 
     */
    async refreshHumanById(id) {
        if (this.human == null) return;
        const humanInfo = await this.getHumanInfo(id);
        if (humanInfo == null) return;

        this.human.setBaseInfo(humanInfo.info);

        this.refreshHuman(humanInfo.data);
    }

    refreshHuman(data) {
        //  设置人物眼睛参数
        console.log('refresh human data :', data);
        const eyeParams = data.user_skin;
        this.applyEyeData(eyeParams);

        //  设置人物装扮
        const articleIds = data.user_article;
        this.dressArticle(articleIds);

        //  设置人物变形
        const targets = data.user_body.target;
        this.applyTargets(targets);

        //  设置人物位置
        this.setPosition(new Vector3(0, 0, 0));
    }

    /**
     * 设置人物眼睛参数
     * @param {object} data 
     * @returns 
     */
    applyEyeData(data) {
        if (this.human == null) return;
        const xOffset = data.eye_offset_x;
        const yOffset = data.eye_offset_y;
        const size = data.eye_size;
        const color = data.eye_color;
        this.human.setEyeOffset(new Vector3(xOffset, yOffset, 0));
        this.human.setEyeScale(size + 1);
        this.human.setEyeColor(Color.parse(color));
    }

    /**
     * 为人物穿衣服
     * @param {string[]} ids 服装资源对应的id
     * @returns 
     */
    async dressArticle(ids) {
        if (this.human == null) return;
        if (ids == null || ids == undefined || ids.length <= 0) return;
        const articleNames = await this.loadArticles(ids);
        if (articleNames != null && articleNames.length > 0) {
            this.human.wearOutfits(...articleNames);
        } else {
            alert('服装不可使用，请联系商务人员！');
        }
    }

    async loadArticles(ids) {
        if (ids == null || ids == undefined || ids.length <= 0) return;
        const token = LicenseManager.getInstance(this.context).genAuthString();
        if (token == null || token == undefined || token == '') return;

        const url = `https://open.metamaker.cn/api/openmm/v1/unity_res_by_ids`;
        const result = await NetWorkHelper.Request(`${url}?ids=${ids.join(',')}`, null, token);
        console.log('HumanHelper get article names :', result);
        const errCode = result.err_code;
        if (errCode == 0) {
            const names = [];
            const ret = result.ret;
            for (const item of ret) {
                names.push(item.name.replace('test/', ''));
            }
            const outfitResult = await ResourceHelper.getInstance(this.context).loadOutfits(names);
            if (outfitResult) {
                return names;
            }
        }
    }

    /**
     * 设置人物变形
     * @param {object[]} targets 需要设置的变形数据，数据格式为：[{id: 10001, weight: 1}]
     * @returns 
     */
    applyTargets(targets) {
        if (this.human == null) return;
        if (targets == null || targets == undefined || targets.length <= 0) return;
        for (const item of targets) {
            this.human.setTarget(item.id, item.weight);
        }
    }

    /**
     * 设置人物位置
     * @param {Vector3} pos 人物位置
     * @returns 
     */
    setPosition(pos) {
        if (this.human == null) return;
        this.human.setPosition(pos);
    }

    isValidId(id) {
        return !(id == null || id == undefined || id.length <= 0 || isNaN(id));
    }
}