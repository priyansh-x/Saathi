export function PhonePreview({ title, body }: { title: string; body: string }) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-border bg-[#111] p-1.5">
      <div className="overflow-hidden rounded-[22px] bg-[#efe7dc]">
        <p className="bg-[#075e54] px-3 py-2 text-[12px] font-medium text-white">{title} · EXAMPLE</p>
        <div className="p-3">
          <p className="rounded-[14px] rounded-tl-[4px] bg-white px-3 py-2 text-sm whitespace-pre-wrap">{body}</p>
        </div>
      </div>
    </article>
  );
}
