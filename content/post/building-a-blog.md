title: Building a Blog
date: 2020-04-26
category: Coding
---

#### Motivation

I lost all my article sources with Hexo a couple of days ago. Since I have been using Hexo for so long, and I still have all the article content, I switched to Hugo. But unfortunately I couldn't find a theme that looked good to me. I remembered reading [a blog post](http://www.stephendiehl.com/posts/decade.html) by _Stephen Diehl_ and I fell in love with the blog theme. It doesn't seem to be very hard to build a theme like that. With [Hugo Templates](https://gohugo.io/templates/introduction/), I wrote a theme which was almost completely copied from his blog. It was really simple and graceful. After a while I was thinking about writing my own static blog generator using the templating method the same as Hugo.

#### Implementation

The whole process can be divided into 3 parts:

1. Convert Markdown posts to HTML
2. Generate HTML files according to specified templates
3. Copy static files

The rather difficult task of these is to parse Markdown and custom templates. But it's still not a problem because I only write what I need instead of building the whole universe.

##### Markdown

To convert Markdowns to HTMLs, it's needed to first convert it into AST (Abstract syntax tree), and then generate HTML from ASTs. This will make it easy to write and debug most of the time.

There are some block elements in Markdown syntax: paragrah, code block, blockquote, ordered list, and unordered list. It means these elements can contain other various Markdown elements and even nested into each other, in contrast to italic, bold, and elements that have a fixed form and can not contain other elements. This is the main problem in parsing Markdown: nested elements.

A simple solution is to parse text in a Parser:

```
blockquotes :: Parser MDElem
blockquotes = do
  cnt <- length <$> lookAhead (some takePrefix)
  text <- mconcat <$> some ((<>"\n") <$> (count cnt takePrefix *> takeTill isEndOfLine <* satisfy isEndOfLine))
  case parseOnly (some mdElem) text of
    Right mdElems -> return (Blockquotes mdElems)
    Left _ -> return (Blockquotes [PlainText text])
  where
    takePrefix = word8 62 <* many (word8 32)
```

On the above example you can see that the text is taken out and fed to `parseOnly (some mdElem)`, which execute another parsing process the text in the parent parsing. But it's important here to use `(some mdElem)` instead of `(many mdElem)`. Because once you apply `(many blockquotes)` above, it leads to an infinite parser for `(parseOnly (many _) _)` always return a `(Right [_])`.

##### Template

With the previous experience of parsing Markdown, this should be easy. Parse template into AST as well, but convert the AST with extra Object maps to replace the variable.

The types of extra resources should be designed in Maps.

```
data ObjectTree = ObjNode (Map ByteString ObjectTree)
                | ObjListNode [Map ByteString ObjectTree]
                | ObjLeaf ByteString
  deriving (Show)
```

The types of template statement can be designed like this:

```
data Stmt = DotStmt ByteString [ByteString]    -- global.post.content -> DotStmt "global" ["post", "content"]
          | ForeachStmt ByteString Stmt [Stmt] -- foreach x in global.posts -> ForeachStmt "x" (DotStmt global.posts) (_)
          | PartialStmt ByteString
          | Raw ByteString
  deriving (Show)
```

When it's time to convert AST back into HTML, feed the conversion function with extra resources in the type of `ObjectTree`.

##### Website Preview

Except for generating the HTML files, running the website locally is sometimes needed. So I built a handy HTTP server with socket. It doesn't look pretty good, but it works anyway.

```
runHTTPServer :: FilePath -> IO ()
runHTTPServer path = do
  putStrLn "HTTP server is running at http://localhost:4000."
  runTCPServer Nothing "4000" (showHtml path)
  where
    showHtml path s = do
        msg <- recv s 1024
        unless (S.null msg) $
          if S.take 3 msg == "GET"
             then do
               resp <- getFile path (toString $ S.takeWhile (/= 32) (S.drop 4 msg))
               sendAll s ("HTTP/1.1 200 OK\n\n" <> resp)
             else sendAll s "HTTP/1.1 200 OK\n\n"

getFile :: FilePath -> FilePath -> IO ByteString
getFile root path
  | last path == '/' = S.readFile (root <> path <> "index.html")
  | otherwise = S.readFile (root <> path)

runTCPServer :: Maybe HostName -> ServiceName -> (Socket -> IO a) -> IO a
runTCPServer host port server = withSocketsDo $ do
  addr <- resolve
  E.bracket (open addr) close loop
  where
    resolve = head <$> getAddrInfo (Just defaultHints) host (Just port)
    open addr = do
      sock <- socket (addrFamily addr) (addrSocketType addr) (addrProtocol addr)
      setSocketOption sock ReuseAddr 1
      withFdSocket sock setCloseOnExecIfNeeded
      bind sock $ addrAddress addr
      listen sock 1024
      return sock
    loop sock = forever $ do
      (conn, _peer) <- accept sock
      void $ forkFinally (server conn) (const $ gracefulClose conn 5000)
```

#### End

The [source code](https://github.com/Nutr1t07/gcwdr) is available on Github.
