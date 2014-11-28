octopusidentity
===============

Passport + mongoose middle ware to manage multiple identity users and non-user contacts without redundancy and conflicts.

It may be usefull as long you try to solve ALL listed challanges:

* you use Passport
* your users can use multiple emails
* your users can authorise with oauth strategies
* your users can have contacts who can be identified either by email and social accounts
* contacts may be users in your system, but doesn't have to be

Tested with strategies:

* google
* github
* linkedin
* facebook
* twitter
* vk

Project that is decoupted part of code I work at in my free time.

Licenced under MIT, of course.