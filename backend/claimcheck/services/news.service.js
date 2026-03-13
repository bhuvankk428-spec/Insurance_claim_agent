const DEFAULT_QUERY = "finance";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeArticle(article) {
  return {
    title: article.title || "Untitled",
    description: article.description || "",
    url: article.url,
    urlToImage: article.image_url || article.urlToImage || article.image,
    publishedAt: article.published_at || article.publishedAt,
    source: article.source || article.source?.name || "Unknown",
  };
}

export async function fetchFinanceNews(req, res) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      status: "error",
      message: "NEWS_API_KEY is not configured on the server",
    });
  }

  const apiUrl = process.env.NEWS_API_URL || "https://api.marketaux.com/v1/news/all";
  const query = process.env.NEWS_QUERY || DEFAULT_QUERY;
  const language = process.env.NEWS_LANGUAGE || "en";
  const pageSize = Number(process.env.NEWS_PAGE_SIZE || 12);
  const fallbackSymbols =
    process.env.NEWS_FALLBACK_SYMBOLS ||
    "SPY,QQQ,AAPL,MSFT,GOOGL,AMZN,TSLA";

  const now = new Date();
  const fromDate = new Date(now.getTime() - ONE_DAY_MS);
  const formatDateTime = (date) => date.toISOString().slice(0, 16);

  async function requestMarketaux(params) {
    const url = new URL(apiUrl);
    url.searchParams.set("api_token", apiKey);
    url.searchParams.set("published_after", formatDateTime(fromDate));
    url.searchParams.set("published_before", formatDateTime(now));
    url.searchParams.set("sort", "published_at");
    url.searchParams.set("language", language);
    url.searchParams.set("limit", String(pageSize));

    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value);
    });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "insure.ai finance news",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText.slice(0, 500));
    }

    return response.json();
  }

  try {
    let data = await requestMarketaux({ search: query });
    let rawArticles = Array.isArray(data.data) ? data.data : [];
    if (rawArticles.length === 0 && fallbackSymbols) {
      data = await requestMarketaux({ symbols: fallbackSymbols });
      rawArticles = Array.isArray(data.data) ? data.data : [];
    }
    const cutoff = fromDate.getTime();

    const articles = rawArticles
      .map(normalizeArticle)
      .filter(
        (article) =>
          article.url &&
          (!article.publishedAt ||
            new Date(article.publishedAt).getTime() >= cutoff)
      );

    res.set("Cache-Control", "no-store");
    return res.json({
      status: "success",
      updatedAt: now.toISOString(),
      from: fromDate.toISOString(),
      to: now.toISOString(),
      articles,
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      message: err?.message || "Unexpected error while fetching news",
    });
  }
}
