When a **TypeScript file** is added or updated, ensure that any new or modified **model entries** are correctly reflected in the **Swagger API documentation**.

***

## **CSS Development Guidelines**

When developing CSS, adhere to the following principles to promote consistency and reusability:

* **Reference Existing Themes:** Always base your work on the existing `theme.css` and `main.css` files.
* **Reusable Styles:** Add styles that are applicable to the entire project to `main.css`.
* **Theming with Variables:** Use **theming variables** for all styling instead of hardcoded values. Define these variables in `theme.css` to enable the creation of various themes. This ensures a maintainable and flexible styling system.
* **Avoid Hardcoding Colors:** Instead of using hardcoded colors in your styles, reference theming variables. This allows for easy customization and theming of the application.
* **Consistent Naming Conventions:** Use consistent naming conventions for classes and variables to improve readability and maintainability.
* **Use Modular Approach:** Break down your styles into smaller, reusable modules. This makes it easier to manage and update styles, as well as to ensure consistency across the application.
* **Avoid Overly Specific Selectors:** Use selectors that are as general as possible. Avoid using overly specific selectors that target a single element, as this can make it more difficult to update styles in the future.
* **Minimize CSS Size:** Keep your CSS files as small as possible by removing any unnecessary whitespace, comments, and unused styles. This can help improve page load times and overall performance.