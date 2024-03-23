import * as Form from "@radix-ui/react-form";
import {ActionFunctionArgs, json, unstable_composeUploadHandlers, type MetaFunction, unstable_parseMultipartFormData} from "@remix-run/node";
import {useActionData} from "@remix-run/react";
import {createClient} from "~/utils/supabase.server";
import fs from 'fs/promises';

import { createImagePreviews, getImagePath} from '~/.server/sharputils';

export const meta: MetaFunction = () => {
    return [
        {title: "New Remix App"},
        {name: "description", content: "Welcome to Remix!"},
    ];
};


function isValidHttpsUrl(url: string): boolean {
    const httpsUrlPattern = /^https:\/\/.+/;
    return httpsUrlPattern.test(url);
}


function s(formData, x, {maxLength = 1024}: { maxLength: number }) {
    const v = formData.get(x);
    const result = v ? String(v) : null;
    if (!result) {
        return null;
    }
    if (maxLength < result.length) {
        return null;
    }
    return result;
}


const ALLOWED_IMAGE_SIZE = 10 * 1024 * 1024; // 10MiB

async function uploadImage(data: AsyncIterable<Uint8Array>, contentType: string): Promise<string | null> {
    console.log(`Uploading image of type: ${contentType}`);
    const fileEnding = contentType.split("/")[1];
    const fileName = Math.random().toString(36).substring(7) + "." + fileEnding;
    let chunksCount = 0;
    let totalSize = 0;
    let tooBig = false;
    const track = async function*()  {
        for await (const chunk of data) {
            totalSize += chunk.length;
            chunksCount += 1;
            if (totalSize > ALLOWED_IMAGE_SIZE) {
                console.log(`Image too large, aborting`);
                tooBig = true;
                return;
            }
            yield chunk;
        }

    }
    console.log(`${chunksCount} chunks with total size ${totalSize / 1024 / 1024 }MiB received`);
    await fs.writeFile(getImagePath(fileName), track());
    if (tooBig) {
        try {
            await fs.rm(getImagePath(fileName));
        }
        catch (e) {
            console.error(`Failed to remove too big file ${fileName}`);
        }
        return null;
    }
   const { small, medium } = await createImagePreviews(fileName);
    return fileName;
}


export async function action({request}: ActionFunctionArgs) {
    const uploadHandler = unstable_composeUploadHandlers(
        async ({ name, contentType, data, filename }) => {
            console.log(`Received file: ${name} (${contentType})`);
            if (name !== "cover" || !filename || !contentType.startsWith("image/")) {
                return undefined;
            }
    
            const uploadImageResult = await uploadImage(data, contentType);
            return uploadImageResult;
        }
    );

    const formData = await unstable_parseMultipartFormData(request, uploadHandler);

    const title = String(formData.get("title"));
    const author = String(formData.get("author"));
    const presenter = String(formData.get("presenter"));
    const description = String(formData.get("description"));
    const coverImage = formData.get("cover");
    if (!coverImage) {
        return json({field: 'error', error: "Image is too big or invalid"} as const, {status: 400});
    }

    const buylink = s(formData, "buylink", {maxLength: 1024});
    const genre = s(formData, "genre", {maxLength: 30});

    // Server-side validation for the title field
    if (!title) {
        return json({field: 'error', error: "Title is required."} as const, {status: 400});
    }
    if (!author) {
        return json({field: 'error', error: "Author is required."} as const, {status: 400});
    }
    if (!presenter) {
        return json({field: 'error', error: "Presenter is required."} as const, {status: 400});
    }
    if (!description) {
        return json({field: 'error', error: "Description is required."} as const, {status: 400});
    }
    if (!genre) {
        //return json({field: 'error', error: "Genre is required or too long."} as const, {status: 400});
    }


    if (buylink && buylink.length > 0 && !isValidHttpsUrl(buylink)) {
        return json({field: 'error', error: `Purchase link looks invalid. ${buylink}`} as const, {status: 400});
    }

    if (Math.max(title.length, author.length, presenter.length, description.length) > 100) {
        return json({field: 'error', error: 'Some form input is too long '} as const, {status: 400});
    }

    const supabase = createClient(request);

    await supabase.from('books').insert({
        title: title,
        author: author,
        presenter: presenter,
        description: description,
        genre: genre,
        buylink: buylink
    });

    // For now, let's just return the submitted data as JSON.
    return json({field: 'okay', title, author, presenter, description} as const);
}


function BookInsertionForm() {
    const actionData = useActionData<typeof action>();

    const inputFieldClassNames = "box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6";

    return (
        <div className="flex gap-2 flex-col w-[100%] items-center">
            <h1>Add a New Book</h1>
            <Form.Root className="flex flex-col gap-2 w-[260px] outline p-3" method="post" encType="multipart/form-data">
                <Form.Field name="title">
                    <Form.Label>Title</Form.Label>
                    <Form.Control required className={inputFieldClassNames}/>
                </Form.Field>
                <Form.Field name="author">
                    <Form.Label>Author</Form.Label>
                    <Form.Control required className={inputFieldClassNames}/>
                </Form.Field>
                <Form.Field name="presenter">
                    <Form.Label>Presenter</Form.Label>
                    <Form.Control required className={inputFieldClassNames}/>
                </Form.Field>
                <Form.Field name="description">
                    <Form.Label>Description</Form.Label>
                    <Form.Control required className={inputFieldClassNames}/>
                </Form.Field>
                <Form.Field name="genre">
                    <Form.Label>Genre</Form.Label>
                    <Form.Control required className={inputFieldClassNames}/>
                </Form.Field>
                <Form.Field name="isbn">
                    <Form.Label>ISBN</Form.Label>
                    <Form.Control className={inputFieldClassNames}/>
                </Form.Field>
                <Form.Field name="cover">
                    <Form.Label>Cover</Form.Label>
                    <Form.Control asChild>
                        <input type="file" className={inputFieldClassNames}/>
                    </Form.Control>
                </Form.Field>
                <Form.Field name="tags">
                    <Form.Label>Tags</Form.Label>
                    <Form.Control className={inputFieldClassNames}/>
                </Form.Field>
             <Form.Submit asChild>
            <button type="submit" value="Add"
    data-sitekey="6Lda05MpAAAAACIqI_Oz46WvRl6JWvKHLFmTQcRi"
    data-callback='onSubmit'
    data-action='submit'
                           className="g-recaptcha box-border w-full text-violet11 shadow-blackA4 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none mt-[10px]">
  Submit</button>
                </Form.Submit>
            </Form.Root>
            {actionData?.field === 'error' && <p style={{color: "red"}}>{actionData.error}</p>}
            {actionData && actionData.field === 'okay' && (
                <div>
                    <h2>Book Submitted</h2>
                    <p>Title: {actionData.title}</p>
                    <p>Author: {actionData.author}</p>
                    <p>Presenter: {actionData.presenter}</p>
                    <p>Description: {actionData.description}</p>
                </div>
            )}
        </div>
    );
}


export default function Index() {
    return (
        <div style={{fontFamily: "system-ui, sans-serif", lineHeight: "1.8"}}>
            <BookInsertionForm/>
        </div>
    );
}
