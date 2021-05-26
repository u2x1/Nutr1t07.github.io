title: CSS Div Shift in Unexpected Way
date: 2020-04-08
category: Coding
---
When writing this blog theme I got a confusing problem that the position of the sidebar on the left of my front page is not the same as the article page: [Pic1](/image/css-div-shift.gif). It seems that it's the scroll bar that causes the strange thing happened. When the article is long enough, the scroll bar appears, making the whole page shifts a little bit to the left.

A straightforward solution is to make the scroll bar always visible or invisible.

```
/* 1. Always visible */
html {
    overflow-y:scroll;
}

/* 2. Always invisible*/
html {
    scrollbar-width: none;    /* Firefox */
    -ms-overflow-style: none; /* Internet Explorer 11 */
}

html::-webkit-scrollbar {     /** WebKit */
  display: none;
}
```

Or automatically add padding-left when scroll bar appears:

```
body {
    padding-left: calc(100vw - 100%);
}
```

`vw` stands for viewport width. The difference here between `100vw` and `100%` is that `100vw` includes the width of the scroll bar, while `100%` does not.

#### Reference

- [How to prevent scrollbar from repositioning web page? - Rapti - Stack Overflow](https://stackoverflow.com/a/30293718/12279828)
- [Hide scroll bar, but while still being able to scroll - Murhaf Sousli - Stack Overflow](https://stackoverflow.com/a/56926685/12279828)