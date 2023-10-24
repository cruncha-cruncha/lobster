export const Search = () => {
    return (
        <div>
            <input
                type="text"
                placeholder="search"
            />
            <p>location (and country) + radius</p>
            <p>min/max price</p>
            <p>include: active, sold, draft, or deleted posts</p>
            <p>secret, url-only option to limit to a list of users</p>
            <p>secret, url-only option to limit to a list of collections</p>
            <p>order by: relevance, offers (most), offers (least), newest, oldest, price (low to high), price (high to low)</p>
            <p>then order by: (the same, minus relevance)</p>
        </div>
    );
}