import { PauseIcon, ReaderIcon } from "@radix-ui/react-icons";
import { Button } from "@radix-ui/themes";







export default function User({ userId }: { userId: string }) {
    const status = Math.random() > 0.5 ? "active" : "inactive";

    return (
        <div>
            <h1>Benedikt</h1>
            <h2>About me</h2>
            <p>Hi, I'm Benedikt. I'm a software engineer and I love to read books. I don't read much fiction but Steppenwolf by Hermann Hesse is capturing my attention.</p>
            {status === 'inactive' && <div className="flex gap-1 justify-center items-center  min-w-min w-min rounded border rounded bg-sky-400"><PauseIcon /><div className="bg-sky-800">Inactive</div></div>}
            {status === 'active' && <div className="flex gap-1 justify-center  min-w-min w-min items-center rounded border bg-green-300"><ReaderIcon /><div className="bg-green-400">Active</div></div>}
            <div className="flex b-1 justify-center flex-cols flex-wrap gap-4">
                <Button className="bg-orange-500 rounded b-1 border">Goodreads</Button>
                <Button className="bg-red-500 rounded b-1 border">Meet up</Button>
                <Button className="bg-purple-500 rounded  b-1 border">Instagram</Button>
                <Button className="bg-green-500 rounded  b-1 border">WhatsApp</Button>
                <Button className="bg-blue-500 rounded  b-1 border">Signal</Button>
            </div>
        </div>
    )

}

