import * as Form from "@radix-ui/react-form";
import {ActionFunctionArgs, json, unstable_composeUploadHandlers, type MetaFunction, unstable_parseMultipartFormData, UploadHandler} from "@remix-run/node";
import {useActionData, useFetcher} from "@remix-run/react";
import {createClient} from "~/utils/supabase.server";
import fs from 'fs/promises';
import { useZxing} from "react-zxing";
import { createImagePreviews, getImagePath} from '~/.server/sharputils';
import { getBookInfo, Book as IsbnSearchBook } from '~/.server/isbnutils';
import { type Book } from "./_index";
import { useEffect, useRef, useState } from "react";
import { LoopIcon } from "@radix-ui/react-icons";

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


function IsbnScanner({book} : {book?: IsbnSearchBook}) {
    const [result, setResult] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const fetcher = useFetcher();

    const searchRef = useRef<IsbnSearchBook>(undefined);
    if (searchRef.current !== book) {
        console.log(`New book to search for: ${book?.isbn}`);
        searchRef.current = book;
        setResult(book?.isbn);
        setIsSearching(Boolean(book));
    }

    const checkIsbn = (isbn: string) => {
        searchRef.current = undefined;
        const formData = new FormData();
        formData.append("isbn", isbn);
        formData.append("_action", "GETBOOKBYISBN");
        fetcher.submit(formData, { method: "post" });
        setIsSearching(true);
    };
    const { ref } = useZxing({
        onDecodeResult(result) {
            setResult(result.getText());
            checkIsbn(result.getText());
        },
    });


    if (ref.current !== null) {
        console.log(`Running scanner on video element: ${ref.current}`);
        console.log(`Time ${ref.current.currentTime} ${ref.current.currentSrc} ${ref.current.paused} ${ref.current.ended}`);
    }


    // debug only
    useEffect(() => {
        setTimeout(() => {
            setResult("9783442178582");
            checkIsbn("9783442178582");
        }, 1000)
    }, []);


    return (
        <>
            <video ref={ref} style={{width: "100%", height: "auto"}}/>
            <p>Scanned ISBN: {result}</p>
            <input type="hidden" name="isbn" value={result} />
            {isSearching && <div className="flex flex-cols gap-2 justify-center"><LoopIcon /> <p>Searching...</p></div> }
        </>
    )
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


export type CoverImages = {
    original: string,
    /** 120px */
    small: string,
    /** 400px */
    medium: string
}

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
    return JSON.stringify({ original: "images/" + fileName, small: "images/" + small, medium: "images/" + medium} satisfies CoverImages );
}

const ALLOWED_STRING_SIZE = 1024; // 1KiB


export async function action({request}: ActionFunctionArgs) {
    // TODO rate limiting
    const decoder = new TextDecoder();
    const uploadHandler: UploadHandler = 
        async ({ name, contentType, data, filename }) => {
            if (contentType === undefined) {
                const intermediateResult = [];
                let length = 0;
                for await (const chunk of data) {
                    intermediateResult.push(chunk);
                    length += chunk.length;
                    if (length > ALLOWED_STRING_SIZE) {
                        console.error(`String too large, aborting`)
                        return undefined;
                    }
                }
                const bytes = new Uint8Array(length);
                for (let i = 0, offset = 0; i < intermediateResult.length; i++) {
                    bytes.set(intermediateResult[i], offset);
                    offset += intermediateResult[i].length;
                }
                const s =  decoder.decode(bytes);
                console.log(`Received string data: ${s}`);
                return s;
            }
            console.log(`Received file: ${name} (${contentType})`);
            if (name !== "cover" || !filename || !contentType.startsWith("image/")) {
                return undefined;
            }
    
            const uploadImageResult = await uploadImage(data, contentType);
            return uploadImageResult;
        };


    if (request.headers.get("content-type")?.startsWith("multipart/form-data") !== true) {
        const formData = await request.formData();
    if (String(formData.get("_action")) === "GETBOOKBYISBN" ) {
        const isbn = String(formData.get("isbn"));
        console.log(`Searching for book with ISBN: ${isbn}`);
        const bookInfo = await getBookInfo(isbn);
        if (!bookInfo) {
            return json({field: 'error', error: "Book not found"} as const, {status: 404})
        }

        return json({ field: 'book', book: bookInfo} as const);
    }

        return json({field: 'error', error: "Invalid request"} as const, {status: 400});
    }
    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    console.log(`Received form data: ${JSON.stringify(Object.fromEntries(formData))}`);



    const title = s(formData, "title", { maxLength: 100});
    const author = s(formData, "author", { maxLength: 100});
    const presenter = s(formData, "presenter", { maxLength: 100});
    const presentedAt = (() => { const x = s(formData, "presentedAt", {maxLength: 30});
        if (!x) {
            return null;
        }
        return new Date(x);
    })();
    const description = s(formData, "description", { maxLength: 100} );
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
    if (!presentedAt) {
        return json({field: 'error', error: "Presentation date is required"} as const, {status: 400});
    }
    if (!description) {
        return json({field: 'error', error: "Description is required."} as const, {status: 400});
    }
    if (!genre) {
        return json({field: 'error', error: "Genre is required or too long."} as const, {status: 400});
    }

    const coversData =  formData.get("cover");
    if (!coversData) {
        return json({field: 'error', error: "Image is too big or invalid"} as const, {status: 400});
    }


    if (buylink && buylink.length > 0 && !isValidHttpsUrl(buylink)) {
        return json({field: 'error', error: `Purchase link looks invalid. ${buylink}`} as const, {status: 400});
    }

    if (Math.max(title.length, author.length, presenter.length, description.length) > 100) {
        return json({field: 'error', error: 'Some form input is too long '} as const, {status: 400});
    }

    const supabase = createClient(request);


    console.log(`Inserting book: ${title} by ${author} presented by ${presenter}`)
    const { error } = await supabase.from('books').insert({
        title: title,
        author: author,
        presenter: presenter,
        presentationDay: presentedAt.toISOString(),
        description: description,
        genre: genre,
        buylink: buylink!,
        covers: String(coversData) as unknown as CoverImages,
        createdBy: "anonymous"
    } as const  satisfies Book);

    if (error) {
        console.error(`Error inserting book: ${error.message}`);
        return json({field: 'error', error: "Error inserting book"} as const, {status: 500});
    }

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
            <input type="hidden" name="_action" value="ADDBOOK" />
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
                <Form.Field name="presentedAt">
                    <Form.Label>Presentation Date</Form.Label>
                    <Form.Control required asChild>
                        <input type="date" className={inputFieldClassNames}/>
                    </Form.Control>
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
                    <Form.Control asChild className={inputFieldClassNames}>
                        <IsbnScanner book={actionData?.field === 'book' ? actionData?.book : undefined  } />
                    </Form.Control>
                </Form.Field>
                <Form.Field name="cover">
                    <Form.Label>Cover</Form.Label>
                    <Form.Control required asChild>
                        <input type="file" accept="image/*" capture className={inputFieldClassNames}/>
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
