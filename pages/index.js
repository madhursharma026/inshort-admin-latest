import axios from "axios";
import Link from "next/link";
import { APIURL } from "./api/hello";
import { useRouter } from "next/router";
import Header from "./components/Header";
import React, { useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const Home = () => {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [show, setShow] = useState(false);
  const [newsData, setNewsData] = useState([]);
  const [language, setLanguage] = useState("all");
  const [description, setDescription] = useState("");
  const [currentNewsId, setCurrentNewsId] = useState(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      router.push("/login");
    }
  }, [router]);

  const NEWS_BY_LANGUAGE_QUERY = `
    query GetNewsByLanguage($language: String!) {
      newsByLanguage(language: $language) {
        id
        url
        title
        author
        status
        language
        sourceURL
        description
        publishedAt
        readMoreContent
        sourceURLFormate
      }
    }
  `;

  const ALL_NEWS_QUERY = `
    query GetNews {
      news {
        id
        url
        title
        author
        status
        language
        sourceURL
        description
        publishedAt
        readMoreContent
        sourceURLFormate
      }
    }
  `;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.post(APIURL, {
          query: language === "all" ? ALL_NEWS_QUERY : NEWS_BY_LANGUAGE_QUERY,
          variables: language === "all" ? {} : { language },
        });
        const news =
          language === "all"
            ? response.data.data.news
            : response.data.data.newsByLanguage;
        setNewsData(news);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    fetchNews();
  }, [language]);

  const UPDATE_NEWS_MUTATION = `
    mutation UpdateNews($id: Int!, $updateNewsInput: UpdateNewsInput!) {
      updateNews(id: $id, updateNewsInput: $updateNewsInput) {
        id
        url
        title
        author
        status
        language
        sourceURL
        description
        publishedAt
        readMoreContent
        sourceURLFormate
      }
    }
  `;

  const handleToggleStatus = async (newsId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await axios.post(APIURL, {
        query: UPDATE_NEWS_MUTATION,
        variables: {
          id: newsId,
          updateNewsInput: { status: newStatus },
        },
      });
      // Update the specific news item in the state
      setNewsData((prevData) =>
        prevData.map((news) =>
          news.id === newsId ? { ...news, status: newStatus } : news
        )
      );
      alert(
        `News ${
          currentStatus === "active" ? "deleted" : "restored"
        } successfully!`
      );
    } catch (error) {
      console.error("Error updating news status:", error);
    }
  };

  const handleShow = (newsId, newsTitle, newsDescription) => {
    setCurrentNewsId(newsId);
    setTitle(newsTitle);
    setDescription(newsDescription);
    setShow(true);
  };

  const handleEditNews = async () => {
    try {
      await axios.post(APIURL, {
        query: UPDATE_NEWS_MUTATION,
        variables: {
          id: currentNewsId,
          updateNewsInput: {
            title,
            description,
          },
        },
      });
      setNewsData((prevData) =>
        prevData.map((news) =>
          news.id === currentNewsId
            ? {
                ...news,
                title: title,
                description: description,
              }
            : news
        )
      );
      setShow(false);
      alert("News updated successfully!");
    } catch (error) {
      console.error("Error while updating news:", error);
    }
  };

  return (
    <>
      <Header />
      <div className="container-lg px-md-5 px-3 mt-3">
        <h1 className="mb-4 text-center">
          <u>News</u>
        </h1>

        <div className="mb-3 text-center">
          <label htmlFor="language" className="form-label">
            Filter by Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="form-select w-auto d-inline-block ms-2"
          >
            <option value="all">All</option>
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="thead-dark">
              <tr>
                <th style={{ minWidth: "200px" }}>Title</th>
                <th
                  className="d-none d-md-table-cell"
                  style={{ minWidth: "300px" }}
                >
                  Description
                </th>
                <th style={{ minWidth: "150px" }}>Action</th>
                <th
                  style={{ minWidth: "100px" }}
                  className="d-none d-lg-table-cell"
                >
                  Read More
                </th>
              </tr>
            </thead>
            <tbody>
              {newsData.map((news) => (
                <tr key={news.id}>
                  <td>{news.title}</td>
                  <td
                    className="d-none d-md-table-cell"
                    dangerouslySetInnerHTML={{ __html: news.description }}
                  />
                  <td>
                    <button
                      type="button"
                      className="btn btn-warning w-100 mt-2"
                      onClick={() =>
                        handleShow(news.id, news.title, news.description)
                      }
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`btn w-100 mt-2 ${
                        news.status === "active" ? "btn-danger" : "btn-info"
                      }`}
                      onClick={() => handleToggleStatus(news.id, news.status)}
                    >
                      {news.status === "active" ? "Delete" : "Restore"}
                    </button>
                  </td>
                  <td className="d-none d-lg-table-cell">
                    <Link
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Read More
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal
        centered
        size="lg"
        show={show}
        keyboard={false}
        backdrop="static"
        onHide={() => setShow(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit News</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label htmlFor="Title" className="form-label">
              Title
            </label>
            <input
              type="text"
              className="form-control"
              id="Title"
              value={title}
              autoComplete="off"
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="Description" className="form-label">
              Description
            </label>
            <ReactQuill
              theme="snow"
              value={description}
              onChange={setDescription}
              required
              style={{ height: "150px" }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="mt-5">
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditNews}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Home;
