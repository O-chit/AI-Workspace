import dotenv from "dotenv";
dotenv.config()
const OpenAI=require("openai");
const client = new OpenAI({
    apiKey:process.env.GEMINI_API_KEY
})
const messages=[
    { role: "system", content: "Bạn là trợ lý AI trong workspace cá nhân, trả lời ngắn gọn, tiếng Việt." },
  { role: "user", content: "Tóm tắt task hôm nay giúp tôi" },
]
const responses = await client.chat.completions.create({
    model: "gpt-2.5-flash",
    messages:[{role:"user",content:"xin chao"}],
})
async function response (req,res){
    const {message}=req.body;
    res.json({reply:response.choices[0].message.content});
}
module.exports={
    client,
    responses,
    response
};