import { PauseIcon, ReaderIcon, SymbolIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";
import { useState } from "react";

export default function User({ userId }: { userId: string }) {

    const [name, setName] = useState("Benedikt");
    const [about, setAbout] = useState("Hi, I'm Benedikt. I'm a software engineer and I love to read books. I don't read much fiction but Steppenwolf by Hermann Hesse is capturing my attention.");

    const status = Math.random() > 0.5 ? "active" : "inactive";
    const [editing, setEditing] = useState(false);

    // why is userId always undefined??
    const showEditButton = true;
    if (!showEditButton) {
        console.log('User', userId, 'is not allowed to edit this page');
    }



    return (
    <div className="flex justify-center pt-3 h-screen">
        <div className="flex flex-col gap-3 w-80 h-96 min-h-96 ">
            {editing ? <input type="text" value={name} onChange={({ currentTarget}) => setName(currentTarget.value) } ></input> : <h1>{name}</h1>}
            <h2>About me</h2>
            <div className="min-w-30 w-30 min-h-60 flex-grow">{editing ? <textarea className="h-[100%] w-[100%]" onChange={({ currentTarget}) => setAbout(currentTarget.value) } value={about}></textarea>  : (<p>{about} </p>)}</div>
            {status === 'inactive' && <div className="flex gap-1 justify-center items-center  min-w-min w-min rounded  border rounded bg-sky-400"><PauseIcon /><div className="bg-sky-800">Inactive</div></div>}
            {status === 'active' && <div className="flex gap-1 justify-center  min-w-min w-min items-center rounded border bg-green-300"><ReaderIcon /><div className="bg-green-400">Active</div></div>}
            <div className="flex b-1 justify-center flex-cols flex-wrap gap-4">
                <Button className="bg-orange-500 rounded b-1 p-1 border">Goodreads</Button>
                <Button className="bg-red-500 rounded b-1 p-1 border">Meet up</Button>
                <Button className="bg-purple-500 rounded  b-1 p-1 border">Instagram</Button>
                <Button className="bg-green-500 rounded  b-1 p-1 border">WhatsApp</Button>
                <Button className="bg-blue-500 rounded  b-1 p-1 border">Signal</Button>
            </div>
            <footer className="mt-auto w-100%">
                { showEditButton && <Button className="bg-blue-500 w-24 h-24 text-lg p-1 rounded b-1 border float-right" onClick={() =>setEditing(e => !e)  } ><SymbolIcon /> Edit</Button>}
            </footer>
        </div></div>
    )

}

