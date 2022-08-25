import { FileHelper } from "./FileHelper";

export class NetWorkHelper {
    static DownloadFile(url, path) {
        if (url == "" || path == "") return;

        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function (e) {
                console.log("download file type :", xhr.status, path);
                console.log("download file url :", url);
                console.log("download file loaded :", e.loaded);
                if (xhr.status == 200) {
                    console.log("download write path :", path);
                    FileHelper.mkdir(path);
                    FileHelper.writeFile(path, new Uint8Array(xhr.response));
                } else {
                    console.error(`资源: ${url} 下载失败!`)
                }
                resolve(xhr.status == 200);
            };
            // xhr.responseType = "blob";
            xhr.responseType = "arraybuffer";
            xhr.open("GET", url, true);
            xhr.send("");
        });
    }

    static async DownloadFiles(files) {
        if (files == null) return;
        const length = Object.keys(files).length;
        if (length <= 0) return;
        const tasks = [];
        for (const url in files) {
            const path = files[url];
            tasks.push(this.DownloadFile(url, path));
        }
        const result = await Promise.all(tasks);
        return result.findIndex((value) => value == false) < 0;
    }

    static Request(url, params, authorization) {
        function formatData(data) {
            const result = Object.entries(data)
                .map(([key, value]) => `${key}=${value}`)
                .join("&");
            return result;
        }
        let method = "POST";
        if (params === null) {
            method = "GET";
        }

        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
        };
        if (authorization != null && authorization != undefined && authorization != "")
            headers["Authorization"] = authorization;
        console.log("HttpRequest url : ", url);
        console.log("HttpRequest params : ", params && formatData(params));
        console.log("HttpRequest authorization : ", authorization);
        return new Promise((resolve) => {
            fetch(url, {
                method: method,
                headers,
                body: params && formatData(params),
            })
                .then((response) => response.json())
                .then((responseJson) => {
                    var code = responseJson.err_code;
                    console.log("code :", code);
                    resolve(responseJson);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    }
}
