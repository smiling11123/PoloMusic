import { request } from "@playwright/test"
import { withCookie } from "./request"

export const getuseinfo = async (params) => {
    return request({
        url: "/user/subcount",
        params: withCookie(),
    }).then((res) => res.data);
}