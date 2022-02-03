/*
 *
 * HomePage
 *
 */

import React, { useEffect, useState, memo, useMemo } from "react";
import { request } from "@strapi/helper-plugin";
import DataView from "../DataView";
import LeftMenu from "../LeftMenu";
import GlobalStyle from "./GlobalStyles";

const INITIAL_PAGE = 1;
const INITIAL_LIMIT = "10";

const HomePage = () => {
  const [models, setModels] = useState([]);
  const [activeModel, setActiveModel] = useState({});
  const [modelData, setModelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(INITIAL_PAGE);
  const [limit, setLimit] = useState(INITIAL_LIMIT); // it should be string for select
  const [totalCount, setTotalCount] = useState(10); // it should be string for select
  const [isCreated, setIsCreated] = useState(true);
  const [isDeleted, setIsDeleted] = useState(true);
  const [hasMapping, setHasMapping] = useState(true);

  const onChangeParams = ({ target }) => {
    switch (target.name) {
      case "params._page":
        setPage(target.value);
        break;

      case "params._limit":
        setLimit(target.value);
        break;

      default:
        break;
    }
  };

  // fetch data for active model
  const fetchData = () => {
    if (activeModel && activeModel.index) {
      // fetch for the model data
      setLoading(true);
      request(
        `/elastic/model?index=${activeModel.index}&_start=${page}&_limit=${limit}`,
        {
          method: "GET",
        }
      )
        .then((res) => {
          setIsCreated(res.status.created);
          setIsDeleted(res.status.deleted);
          setHasMapping(res.status.hasMapping);
          setModelData(res.data);
          setTotalCount(res.total || 10);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    // fetch all models
    request(`/elastic/models`, {
      method: "GET",
    })
      .then((res) => {
        if (res && res.length && res.length > 0) {
          setModels(res);
          setActiveModel(res[0]);
        }
      })
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeModel, page, limit]);

  return (
    <div className="row">
      <GlobalStyle />
      <div className="d-flex w-100 px-3">
        <LeftMenu
          models={models}
          activeModel={activeModel}
          setActiveModel={(model) => {
            setPage(INITIAL_PAGE);
            setLimit(INITIAL_LIMIT);
            setActiveModel(model);
          }}
        />
        <DataView
          data={modelData}
          refreshData={fetchData}
          activeModel={activeModel}
          loading={loading}
          page={page}
          limit={limit}
          onChangeParams={onChangeParams}
          totalCount={totalCount}
          isMigrateActive={!!activeModel?.migration}
          isCreated={isCreated}
          isDeleted={isDeleted}
          hasMapping={hasMapping}
        />
      </div>
    </div>
  );
};

export default memo(HomePage);
