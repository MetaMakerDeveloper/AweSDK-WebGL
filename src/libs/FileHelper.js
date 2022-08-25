import { AweSDK } from "./AweSDK";

export class FileHelper {
    static mkdir(path) {
        if (path == null || path == undefined || path == "") return;
        const fsObj = AweSDK.getUnityObject().Module["GetFS"]();

        const route = path.split("/");
        let dir = "";
        let index = path.charAt(0) == "/" ? 1 : 0;
        const length = path.indexOf(".") > 0 ? route.length - 1 : route.length;
        while (index < length) {
            dir = `${dir}/${route[index]}`;
            try {
                fsObj.mkdir(dir);
            } catch (e) {
                console.warn(e);
            }
            index++;
        }
    }

    static writeFile(path, bytes) {
        if (path == "" || bytes == null) return;
        const fsObj = AweSDK.getUnityObject().Module["GetFS"]();
        fsObj.writeFile(path, bytes);
    }

    /**
     * 
     * @param {string} path 
     * @param {string} encoding is utf8 or binary
     * @returns 
     */
    static readFile(path, encoding = 'utf8') {
        if (path == '' || path == undefined || path == null)
            return;
        if (encoding != 'utf8' || encoding != 'binary')
            return;
        var result = '';
        try {
            const fsObj = AweSDK.getUnityObject().Module["GetFS"]();
            result = fsObj.readFile(path, { encoding });
        } catch (e) {
            console.warn(e);
        }
        return result;
    }

    static isExist(path) {
        if (path == '' || path == undefined || path == null)
            return false;
        const fsObj = AweSDK.getUnityObject().Module["GetFS"]();
        var length = 0;
        try {
            var stat = fsObj.stat(path);
            length = stat.size;
        } catch (e) {
            console.warn(e);
        }
        return length > 0;
    }
}
