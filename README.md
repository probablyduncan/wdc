ok, here's how it will work
each page has a number of front-matter exports and a number of client functions
index.astro is the start
each page exports a list of transitions, numbered or not
and the last transition is always a transition to another page
so that way, we don't have to worry about a list of pages, or anything like that







## slides infrastructure

slides can either be a new `.astro` page, or a client-side transition on the same `.astro` page
slides should have a forward/back, or on/off, or whatever function
slides should be toggleable via arrow keys as well as via buttons

on next slide, the new slide's on() function is called
on prev slide, the previous current slide's off() function is called

transitioning to a new/prev page/route will be jumpy, and require a load. Maybe use view transitions? Maybe not worth the extra effort?

both functions are `(instant: boolean = false) => Promise<void>`
they should also be cancelable?
maybe instead of returning `Promise<void>`, they should return an abort controller or something?
unsure

`begin(instant: boolean = false)` - calls start function, this may take some time or may be instant, if `instant` is true then it will always be instant/fast forwarded
`revert()` - revert changes, called when going back to prev slide
also need to be able to cancel in-progress animation. Maybe begin() can return an abortController? or begin can return

or, what if there's one function:
```
(instant: boolean = false) => Promise<{
    cancel: () => Promise<void>;
    fastForward: () => Promise<void>;
    revert: () => Promise<void>;
}>
```
this is stored on window for the current slide

unsure what those functions should be called. open to suggestions

need a way to:
- start transition to the next slide
- fast forward transition (in progress or not)
- revert transition (always instant)

slides can be numbered or non-numbered
there are elements on the page with `data-slide-number` attr, which should display the current slide number. If a slide is non-numbered (for example, a simple transition), the current slide number display will stay the same. If a slide is numbered (for example, a full page change), the current slide number will increment when it's toggled. Some on-page transitions may be numbered, and some full .astro pages will not be numbered.
so there are two indexes and lengths:
- total count of all slides/transitions, and current index in that list
- count of numbered slides/transitions, and current slide number which is displayed on the page
on any page, both in client js and in astro frontmatter, I need a way to get all four of these numbers: the total count, the total numbered slide count, the current index, and the current slide number for display
in frontmatter, the current should be the starting index/display for that page

slides:
can be numbered or non-numbered
- navigate to page or call next function

so I should have a master list of pages, I guess
and then each page should have a way to define transition/slide functions that get called 

a list of pages
each page can be numbered or not
each page should have a list of transitions. each transition is a function name?
each transition can be numbered or not

### scenarios

variables:
- direction: prev, or next
- current slide type: page (i.e. initial/first 'slide' on .astro page), or midway on-page transition, or last on-page transition
- is current slide still transitioning/animating

scenarios:
- next slide, current is not the last transition on the page, current slide done transitioning: just begin next slide transition
- next slide, current slide still transitioning: fast forward current transition
- next slide, current is last on page transition or page with no more transitions, current slide done transitioning: go to next page, which should begin that page's initial transition

- prev slide, current slide is not yet done transitioning: cancel/revert current transition
- prev slide, current is not the initial page slide, current slide is done transitioning: just revert current slide
- prev slide, current is the initial page slide, current slide is done transitioning: go to prev page and fast-forward all slides on that page