import api from "./client";



export async function startEmail2FA(){

    await api.post(
        "/profile/2fa/email/start"
    );

}



export async function verifyEmail2FA(
    code:string
){

    const res =
    await api.post(
        "/profile/2fa/email/verify",
        {
            code
        }
    );


    return res.data;

}





export async function setupGoogle2FA(){

    const res =
    await api.post(
        "/profile/2fa/google/setup"
    );


    return res.data;

}





export async function verifyGoogle2FA(
code:string
){

const res =
await api.post(
"/profile/2fa/google/verify",
{
code
}
);


return res.data;

}