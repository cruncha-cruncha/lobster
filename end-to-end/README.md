# Testing

This directory is quite frankly a mess. It does run tests, and it is extensible (has nice JSON), but it needs comments and doesn't handle errors well. Documentation TODO.

I have another philosophical rambling here: the frontend should be tested by people. Or at least there are better tools for it. And unit testing doesn'tmahe a ton of sense to me in web world (safety critical, hardware, embedded, then sure). End-to-end regression tests make way more sense to me. It gets the user what they want. Monitoring can accomplish what unit tests could do, and come with the added benefit of they heasure performance. I'm not sure this suite is really end-to-end. This is end-to-end of back-end services, which in a micro-architecture world is vital.

I decided to write my own to see if I could, and because I was frustated by the options out there. I want my tests to run in a specefic order, carry out multiple steps, be configurable with JSON, and communicate solely via http.