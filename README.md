# Oshaberi

This is a ChatGPT-like website built with Vue 3 and Express.js. The project utilizes Vite for the front-end and Express.js for the server-side.

## Getting Started

To get started with the Oshaberi ChatGPT Client, follow the instructions below.

### Prerequisites

- Node.js (version >= 18.x)
- Yarn (version >= 2)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/pomadgw/oshaberi.git
cd oshaberi
```

2. Install the dependencies:

```bash
yarn install
```

3. Set up environment variables:

Copy the `.env.sample` file to `.env`:

```bash
cp .env.sample .env
```

Edit the `.env` file and provide the required values for the environment variables, including the OpenAI API key, server hostname, and port.

### Usage

1. Start the development server:

```bash
yarn dev
```

2. Access the ChatGPT client website by navigating to `http://localhost:3000` in your web browser.

3. To build the project, run `yarn build`. Then you can run `yarn start` to start the production server.

## Contributing

Contributions are welcome! If you find any bugs or have suggestions for improvement, please create a new issue on the GitHub repository.

1. Fork the project repository.
2. Create your feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
