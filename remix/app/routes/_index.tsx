import * as Form from "@radix-ui/react-form";
import { Dialog } from "@radix-ui/themes";
import { ActionFunctionArgs, json, LoaderFunctionArgs, type MetaFunction } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import React, { useState } from "react";
import { useContext } from "react";
import { createClient } from "~/utils/supabase.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};
type Book = {
  id: string;
  title: string;
	image: string;

};


const books = [

]


export async function loader({request }: LoaderFunctionArgs) {
		//const supabase = createClient(request);
		//const {data: recentBooks } = await supabase.from('books').select('*').limit(10)
		//
		//
		//return json({ recentBooks });
		return json(
				{
						recentBooks: books.map((book, index) => ({
								id: String(index),
								title: `Book ${index + 1}`,
								image: book
						} satisfies Book))
				}
		);
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = String(formData.get("title"));
  const author = String(formData.get("author"));
  const presenter = String(formData.get("presenter"));
  const description = String(formData.get("description"));

  // Server-side validation for the title field
  if (!title) {
    return json({ field: 'error', error: "Title is required." } as const, { status: 400 });
  }

	console.log('sever side validation', title, author, presenter, description);

  // Here, you would typically handle the insertion logic,
  // such as saving the book data to a database.

  // For demonstration, let's pretend we insert and then redirect to a success page (or you can customize as needed)
  // return redirect('/success-page');

  // For now, let's just return the submitted data as JSON.
  return json({ field: 'okay', title, author, presenter, description } as const);
}



function BookInsertionForm() {
  const actionData = useActionData<typeof action>();

	const inputFieldClassNames = "box-border w-full bg-blackA2 shadow-blackA6 inline-flex h-[35px] appearance-none items-center justify-center rounded-[4px] px-[10px] text-[15px] leading-none shadow-[0_0_0_1px] outline-none hover:shadow-[0_0_0_1px_black] focus:shadow-[0_0_0_2px_black] selection:color-white selection:bg-blackA6";

  return (
    <div className="flex gap-2 flex-col">
      <h1>Add a New Book</h1>
			<Form.Root className="flex flex-col gap-2 w-[260px] outline p-3" method="post">
				<Form.Field name="title">
						<Form.Label>Title</Form.Label>
						<Form.Control required className={inputFieldClassNames} />
				</Form.Field>
				<Form.Field name="author">
						<Form.Label>Author</Form.Label>
						<Form.Control required  className={inputFieldClassNames} />
				</Form.Field>
				<Form.Field name="presenter">
						<Form.Label>Presenter</Form.Label>
						<Form.Control required  className={inputFieldClassNames} />
				</Form.Field>
				<Form.Field name="description">
						<Form.Label>Description</Form.Label>
						<Form.Control required  className={inputFieldClassNames} />
				</Form.Field>
				<Form.Field name="genre">
						<Form.Label>Genre</Form.Label>
						<Form.Control required  className={inputFieldClassNames} />
				</Form.Field>
				<Form.Field name="isbn">
						<Form.Label>ISBN</Form.Label>
						<Form.Control  className={inputFieldClassNames} />
				</Form.Field>

				<Form.Field name="cover">
						<Form.Label>Cover</Form.Label>
						<Form.Control  className={inputFieldClassNames} />
				</Form.Field>

				<Form.Field name="tags">
				<Form.Label>Tags</Form.Label>
				<Form.Control  className={inputFieldClassNames} />
				</Form.Field>
				<Form.Submit asChild>
						 <input type="submit" value="Add" className="box-border w-full text-violet11 shadow-blackA4 hover:bg-mauve3 inline-flex h-[35px] items-center justify-center rounded-[4px] bg-white px-[15px] font-medium leading-none shadow-[0_2px_10px] focus:shadow-[0_0_0_2px] focus:shadow-black focus:outline-none mt-[10px]" />
				</Form.Submit>
		 </Form.Root>
      {actionData?.field === 'error' && <p style={{ color: "red" }}>{actionData.error}</p>}
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


const bookDetailsContext = React.createContext<{ book: Book } | null>(null);
function Book ({ book, onClick }: { book: Book, onClick: () => void }) {
		return (
				<div className="flex items-center flex-col"  onClick={onClick}>
						<h3>{book.title}</h3>
						<img className="max-w-24" src={book.image} alt={book.title} />
				</div>
		)

}



export function BookDetails() {
		const bookDetails = useContext(bookDetailsContext) ;
		if (!bookDetails) return null;
		return (
						<div className="flex flex-col gap-2">
								<h1>{bookDetails.book.title}</h1>
								<img className="max-w-24" src={bookDetails.book.image} alt={bookDetails.book.title} />
						</div>

)
}

export function RecentBooks({	books, onClick }: { books: Book[], onClick: (book: Book) => void }) {
		return (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{books.map((book) => (
								<Book key={book.id} book={book} onClick={() => onClick(book)} />
						)
						)};
				</div>


		)
}


export default function Index() {
 const { recentBooks } = useLoaderData<typeof loader>();
const [book, setBook] = useState(recentBooks[0]);

  return (
	  <bookDetailsContext.Provider value={{ book }}>
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
				<BookDetails />
				<BookInsertionForm />
				<RecentBooks books={recentBooks} onClick={b => setBook(b)}/>
    </div>
		</bookDetailsContext.Provider>
  );
}
